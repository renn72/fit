import { db } from '@fit/db'
import { exercise, superSetToExercise } from '@fit/db/schema/exercise'

import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	ExerciseCreateInput,
	ExerciseDeleteInput,
	ExerciseGetAllOrgInput,
	ExerciseGetInput,
	ExerciseUpdateInput,
	SuperSetAddExerciseInput,
	SuperSetCreateInput,
	SuperSetGetExercisesInput,
	SuperSetRemoveExerciseInput,
	SuperSetUpdateInput,
} from '../schemas/exercise'

function mapExerciseOutput(exerciseRow: any) {
	return {
		...exerciseRow,
		movementName: exerciseRow.movement?.name ?? null,
		creatorName: exerciseRow.creator?.name ?? null,
		creatorEmail: exerciseRow.creator?.email ?? null,
		organisationName: exerciseRow.organisation?.name ?? null,
		organisationSlug: exerciseRow.organisation?.slug ?? null,
		superSetExercises: (exerciseRow.superSetExercises ?? []).map(
			(link: any) => ({
				...link,
				exercise: link.exercise
					? {
							...link.exercise,
							movementName: link.exercise.movement?.name ?? null,
						}
					: null,
			}),
		),
	}
}

export const exerciseRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/exercise/all',
			summary: 'Get all exercises across all organisations (dictator only)',
			tags: ['Exercise'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only dictators can view all exercises',
				})
			}

			const exercises = await db.query.exercise.findMany({
				with: {
					movement: {
						columns: {
							name: true,
						},
					},
					creator: {
						columns: {
							name: true,
							email: true,
						},
					},
					organisation: {
						columns: {
							name: true,
							slug: true,
						},
					},
					superSetExercises: {
						with: {
							exercise: {
								with: {
									movement: {
										columns: {
											name: true,
										},
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.order)],
					},
				},
				orderBy: (exercise, { desc }) => [desc(exercise.createdAt)],
			})

			return exercises.map(mapExerciseOutput)
		}),

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/exercise/org',
			summary: 'Get all exercises for an organisation',
			tags: ['Exercise'],
		})
		.input(ExerciseGetAllOrgInput)
		.handler(async ({ input }) => {
			const exercises = await db.query.exercise.findMany({
				where: { organisationId: input.organisationId },
				with: {
					movement: {
						columns: {
							name: true,
						},
					},
					superSetExercises: {
						with: {
							exercise: {
								with: {
									movement: {
										columns: {
											name: true,
										},
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.order)],
					},
				},
			})

			return exercises.map(mapExerciseOutput)
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/exercise/:id',
			summary: 'Get an exercise by ID',
			tags: ['Exercise'],
		})
		.input(ExerciseGetInput)
		.handler(async ({ input }) => {
			const ex = await db.query.exercise.findFirst({
				where: { id: input.id },
				with: {
					movement: {
						columns: {
							name: true,
						},
					},
					superSetExercises: {
						with: {
							exercise: {
								with: {
									movement: {
										columns: {
											name: true,
										},
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.order)],
					},
				},
			})

			return ex ? mapExerciseOutput(ex) : null
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/exercise',
			summary: 'Create an exercise',
			tags: ['Exercise'],
		})
		.input(ExerciseCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create exercises',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newExercise] = await db
				.insert(exercise)
				.values({
					...input,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newExercise
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/exercise',
			summary: 'Update an exercise',
			tags: ['Exercise'],
		})
		.input(ExerciseUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update exercises',
				})
			}

			const { id, ...updateData } = input

			const [updated] = await db
				.update(exercise)
				.set(updateData)
				.where(eq(exercise.id, id))
				.returning()

			if (!updated) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Exercise not found',
				})
			}

			if (input.isSuperSet === false) {
				await db
					.delete(superSetToExercise)
					.where(eq(superSetToExercise.superSetId, id))
			}

			return updated
		}),

	createSuperSet: protectedProcedure
		.route({
			method: 'POST',
			path: '/exercise/superset',
			summary: 'Create a superset with existing and/or new exercises',
			tags: ['Exercise', 'SuperSet'],
		})
		.input(SuperSetCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create supersets',
				})
			}

			const organisationId = context.session.user.organisationId
			if (!organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const existingMemberIds = input.members
				.map((member) => member.exerciseId)
				.filter((id): id is string => !!id)
			if (new Set(existingMemberIds).size !== existingMemberIds.length) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Duplicate exercises are not allowed in a superset',
				})
			}

			const superSetId = await db.transaction(async (tx) => {
				const [newSuperSet] = await tx
					.insert(exercise)
					.values({
						name: input.name,
						isSuperSet: true,
						targetRpe: input.targetRpe ?? null,
						restTime: input.restTime ?? null,
						restUnit: input.restUnit ?? null,
						notes: input.notes ?? null,
						movementId: null,
						sets: null,
						reps: null,
						repUnit: null,
						ormPercent: null,
						tempoDown: null,
						tempoPause: null,
						tempoUp: null,
						creatorId: context.session.user.id,
						organisationId,
					})
					.returning()

				if (!newSuperSet) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to create superset',
					})
				}

				for (const [index, member] of input.members.entries()) {
					let memberExerciseId = member.exerciseId ?? null

					if (memberExerciseId) {
						const existingExercise = await tx.query.exercise.findFirst({
							where: { id: memberExerciseId },
						})

						if (!existingExercise) {
							throw new ORPCError('NOT_FOUND', {
								message: 'Exercise in superset members not found',
							})
						}

						if (existingExercise.organisationId !== organisationId) {
							throw new ORPCError('FORBIDDEN', {
								message:
									'You can only add exercises from your organisation to a superset',
							})
						}

						if (existingExercise.isSuperSet) {
							throw new ORPCError('BAD_REQUEST', {
								message: 'Supersets cannot include other supersets',
							})
						}
					} else if (member.newExercise) {
						const [newMemberExercise] = await tx
							.insert(exercise)
							.values({
								name: member.newExercise.name,
								movementId: member.newExercise.movementId ?? null,
								sets: member.newExercise.sets ?? null,
								reps: member.newExercise.reps ?? null,
								repUnit: member.newExercise.repUnit ?? null,
								ormPercent: member.newExercise.ormPercent ?? null,
								targetRpe: null,
								restTime: null,
								restUnit: null,
								tempoDown: member.newExercise.tempoDown ?? null,
								tempoPause: member.newExercise.tempoPause ?? null,
								tempoUp: member.newExercise.tempoUp ?? null,
								notes: member.newExercise.notes ?? null,
								isSuperSet: false,
								creatorId: context.session.user.id,
								organisationId,
							})
							.returning()

						memberExerciseId = newMemberExercise?.id ?? null
					}

					if (!memberExerciseId) {
						throw new ORPCError('BAD_REQUEST', {
							message: 'Superset member is invalid',
						})
					}

					await tx.insert(superSetToExercise).values({
						superSetId: newSuperSet.id,
						exerciseId: memberExerciseId,
						order: member.order ?? index,
					})
				}

				return newSuperSet.id
			})

			const createdSuperSet = await db.query.exercise.findFirst({
				where: { id: superSetId },
				with: {
					movement: {
						columns: {
							name: true,
						},
					},
					superSetExercises: {
						with: {
							exercise: {
								with: {
									movement: {
										columns: {
											name: true,
										},
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.order)],
					},
				},
			})

			if (!createdSuperSet) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'Superset was created but could not be loaded',
				})
			}

			return mapExerciseOutput(createdSuperSet)
		}),

	updateSuperSet: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/exercise/superset',
			summary: 'Update a superset and replace its member exercises',
			tags: ['Exercise', 'SuperSet'],
		})
		.input(SuperSetUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update supersets',
				})
			}

			const organisationId = context.session.user.organisationId
			if (!organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const existingMemberIds = input.members
				.map((member) => member.exerciseId)
				.filter((id): id is string => !!id)
			if (new Set(existingMemberIds).size !== existingMemberIds.length) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Duplicate exercises are not allowed in a superset',
				})
			}

			await db.transaction(async (tx) => {
				const existingSuperSet = await tx.query.exercise.findFirst({
					where: { id: input.id },
				})

				if (!existingSuperSet) {
					throw new ORPCError('NOT_FOUND', {
						message: 'Superset not found',
					})
				}

				if (existingSuperSet.organisationId !== organisationId) {
					throw new ORPCError('FORBIDDEN', {
						message: 'You can only update supersets from your organisation',
					})
				}

				await tx
					.update(exercise)
					.set({
						name: input.name,
						isSuperSet: true,
						targetRpe: input.targetRpe ?? null,
						restTime: input.restTime ?? null,
						restUnit: input.restUnit ?? null,
						notes: input.notes ?? null,
						movementId: null,
						sets: null,
						reps: null,
						repUnit: null,
						ormPercent: null,
						tempoDown: null,
						tempoPause: null,
						tempoUp: null,
					})
					.where(eq(exercise.id, input.id))

				await tx
					.delete(superSetToExercise)
					.where(eq(superSetToExercise.superSetId, input.id))

				for (const [index, member] of input.members.entries()) {
					let memberExerciseId = member.exerciseId ?? null

					if (memberExerciseId) {
						if (memberExerciseId === input.id) {
							throw new ORPCError('BAD_REQUEST', {
								message: 'A superset cannot include itself as a member',
							})
						}

						const existingExercise = await tx.query.exercise.findFirst({
							where: { id: memberExerciseId },
						})

						if (!existingExercise) {
							throw new ORPCError('NOT_FOUND', {
								message: 'Exercise in superset members not found',
							})
						}

						if (existingExercise.organisationId !== organisationId) {
							throw new ORPCError('FORBIDDEN', {
								message:
									'You can only add exercises from your organisation to a superset',
							})
						}

						if (existingExercise.isSuperSet) {
							throw new ORPCError('BAD_REQUEST', {
								message: 'Supersets cannot include other supersets',
							})
						}
					} else if (member.newExercise) {
						const [newMemberExercise] = await tx
							.insert(exercise)
							.values({
								name: member.newExercise.name,
								movementId: member.newExercise.movementId ?? null,
								sets: member.newExercise.sets ?? null,
								reps: member.newExercise.reps ?? null,
								repUnit: member.newExercise.repUnit ?? null,
								ormPercent: member.newExercise.ormPercent ?? null,
								targetRpe: null,
								restTime: null,
								restUnit: null,
								tempoDown: member.newExercise.tempoDown ?? null,
								tempoPause: member.newExercise.tempoPause ?? null,
								tempoUp: member.newExercise.tempoUp ?? null,
								notes: member.newExercise.notes ?? null,
								isSuperSet: false,
								creatorId: context.session.user.id,
								organisationId,
							})
							.returning()

						memberExerciseId = newMemberExercise?.id ?? null
					}

					if (!memberExerciseId) {
						throw new ORPCError('BAD_REQUEST', {
							message: 'Superset member is invalid',
						})
					}

					await tx.insert(superSetToExercise).values({
						superSetId: input.id,
						exerciseId: memberExerciseId,
						order: member.order ?? index,
					})
				}
			})

			const updatedSuperSet = await db.query.exercise.findFirst({
				where: { id: input.id },
				with: {
					movement: {
						columns: {
							name: true,
						},
					},
					superSetExercises: {
						with: {
							exercise: {
								with: {
									movement: {
										columns: {
											name: true,
										},
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.order)],
					},
				},
			})

			if (!updatedSuperSet) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Superset not found after update',
				})
			}

			return mapExerciseOutput(updatedSuperSet)
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/exercise/:id',
			summary: 'Delete an exercise',
			tags: ['Exercise'],
		})
		.input(ExerciseDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete exercises',
				})
			}

			await db.delete(exercise).where(eq(exercise.id, input.id))
			return { success: true, id: input.id }
		}),

	// ***************** Super Set Operations *******************
	addToSuperSet: protectedProcedure
		.route({
			method: 'POST',
			path: '/exercise/superset/add',
			summary: 'Add an exercise to a superset',
			tags: ['Exercise', 'SuperSet'],
		})
		.input(SuperSetAddExerciseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify supersets',
				})
			}

			// Verify the superSetId points to an exercise marked as isSuperSet
			const superSet = await db.query.exercise.findFirst({
				where: { id: input.superSetId },
			})

			if (!superSet) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Superset exercise not found',
				})
			}

			if (!superSet.isSuperSet) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'The specified exercise is not marked as a superset',
				})
			}

			// Verify the exercise exists
			const exerciseToAdd = await db.query.exercise.findFirst({
				where: { id: input.exerciseId },
			})

			if (!exerciseToAdd) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Exercise to add not found',
				})
			}

			// Add the exercise to the superset
			const [link] = await db
				.insert(superSetToExercise)
				.values({
					superSetId: input.superSetId,
					exerciseId: input.exerciseId,
					order: input.order ?? 0,
				})
				.returning()

			return link
		}),

	removeFromSuperSet: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/exercise/superset/remove',
			summary: 'Remove an exercise from a superset',
			tags: ['Exercise', 'SuperSet'],
		})
		.input(SuperSetRemoveExerciseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify supersets',
				})
			}

			await db
				.delete(superSetToExercise)
				.where(
					and(
						eq(superSetToExercise.superSetId, input.superSetId),
						eq(superSetToExercise.exerciseId, input.exerciseId),
					),
				)

			return { success: true }
		}),

	getSuperSetExercises: protectedProcedure
		.route({
			method: 'GET',
			path: '/exercise/superset/:superSetId',
			summary: 'Get all exercises in a superset',
			tags: ['Exercise', 'SuperSet'],
		})
		.input(SuperSetGetExercisesInput)
		.handler(async ({ input }) => {
			const links = await db.query.superSetToExercise.findMany({
				where: { superSetId: input.superSetId },
				with: {
					exercise: {
						with: {
							movement: {
								columns: {
									name: true,
								},
							},
						},
					},
				},
				orderBy: (link, { asc }) => [asc(link.order)],
			})

			return links.map((link) => ({
				...link,
				exercise: {
					...link.exercise,
					movementName: link.exercise?.movement?.name ?? null,
				},
			}))
		}),
}
