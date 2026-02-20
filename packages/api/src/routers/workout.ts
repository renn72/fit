import { db } from '@fit/db'
import {
	workout,
	workoutToExercise,
	workoutToSuperSet,
} from '@fit/db/schema/workout'

import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	WorkoutAddExerciseInput,
	WorkoutAddSuperSetInput,
	WorkoutCreateInput,
	WorkoutDeleteInput,
	WorkoutGetAllOrgInput,
	WorkoutGetInput,
	WorkoutRemoveExerciseInput,
	WorkoutRemoveSuperSetInput,
	WorkoutUpdateInput,
} from '../schemas/workout'

export const workoutRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/workout/all',
			summary: 'Get all workouts across all organisations (dictator only)',
			tags: ['Workout'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only dictators can view all workouts',
				})
			}

			const workouts = await db.query.workout.findMany({
				with: {
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
				},
				orderBy: (workout, { desc }) => [desc(workout.createdAt)],
			})

			return workouts.map((w) => ({
				...w,
				creatorName: w.creator?.name ?? null,
				creatorEmail: w.creator?.email ?? null,
				organisationName: w.organisation?.name ?? null,
				organisationSlug: w.organisation?.slug ?? null,
			}))
		}),

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/workout/org',
			summary: 'Get all workouts for an organisation',
			tags: ['Workout'],
		})
		.input(WorkoutGetAllOrgInput)
		.handler(async ({ input, context }) => {
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to view workouts for this organisation',
				})
			}

			const workouts = await db.query.workout.findMany({
				where: { organisationId: input.organisationId },
				with: {
					exercises: {
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
						orderBy: (link, { asc }) => [asc(link.index)],
					},
					superSets: {
						with: {
							superSet: {
								with: {
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
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.index)],
					},
					warmupGroup: {
						with: {
							warmups: true,
						},
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
				orderBy: (workout, { desc }) => [desc(workout.createdAt)],
			})

			return workouts
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/workout/:id',
			summary: 'Get a workout by ID with all exercises and supersets',
			tags: ['Workout'],
		})
		.input(WorkoutGetInput)
		.handler(async ({ input, context }) => {
			const workoutData = await db.query.workout.findFirst({
				where: { id: input.id },
				with: {
					exercises: {
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
						orderBy: (link, { asc }) => [asc(link.index)],
					},
					superSets: {
						with: {
							superSet: {
								with: {
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
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.index)],
					},
					warmupGroup: {
						with: {
							warmups: true,
						},
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			if (!workoutData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Workout not found',
				})
			}

			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (workoutData.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view this workout',
				})
			}

			return workoutData
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/workout',
			summary: 'Create a workout',
			tags: ['Workout'],
		})
		.input(WorkoutCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create workouts',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newWorkout] = await db
				.insert(workout)
				.values({
					...input,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newWorkout
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/workout',
			summary: 'Update a workout',
			tags: ['Workout'],
		})
		.input(WorkoutUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update workouts',
				})
			}

			const { id, ...updateData } = input

			const [updated] = await db
				.update(workout)
				.set(updateData)
				.where(eq(workout.id, id))
				.returning()

			if (!updated) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Workout not found',
				})
			}

			return updated
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/workout/:id',
			summary: 'Delete a workout',
			tags: ['Workout'],
		})
		.input(WorkoutDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete workouts',
				})
			}

			await db.delete(workout).where(eq(workout.id, input.id))
			return { success: true, id: input.id }
		}),

	// ***************** Workout Exercise Operations *******************
	addExercise: protectedProcedure
		.route({
			method: 'POST',
			path: '/workout/exercise/add',
			summary: 'Add an exercise to a workout',
			tags: ['Workout'],
		})
		.input(WorkoutAddExerciseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify workouts',
				})
			}

			// Verify workout exists
			const workoutData = await db.query.workout.findFirst({
				where: { id: input.workoutId },
			})

			if (!workoutData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Workout not found',
				})
			}

			// Verify exercise exists
			const exerciseData = await db.query.exercise.findFirst({
				where: { id: input.exerciseId },
			})

			if (!exerciseData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Exercise not found',
				})
			}

			const [link] = await db
				.insert(workoutToExercise)
				.values({
					workoutId: input.workoutId,
					exerciseId: input.exerciseId,
					index: input.index,
				})
				.returning()

			return link
		}),

	removeExercise: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/workout/exercise/remove',
			summary: 'Remove an exercise from a workout',
			tags: ['Workout'],
		})
		.input(WorkoutRemoveExerciseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify workouts',
				})
			}

			await db
				.delete(workoutToExercise)
				.where(
					and(
						eq(workoutToExercise.workoutId, input.workoutId),
						eq(workoutToExercise.exerciseId, input.exerciseId),
					),
				)

			return { success: true }
		}),

	// ***************** Workout SuperSet Operations *******************
	addSuperSet: protectedProcedure
		.route({
			method: 'POST',
			path: '/workout/superset/add',
			summary: 'Add a superset to a workout',
			tags: ['Workout'],
		})
		.input(WorkoutAddSuperSetInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify workouts',
				})
			}

			// Verify workout exists
			const workoutData = await db.query.workout.findFirst({
				where: { id: input.workoutId },
			})

			if (!workoutData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Workout not found',
				})
			}

			// Verify superset exists and is marked as isSuperSet
			const superSetData = await db.query.exercise.findFirst({
				where: { id: input.superSetId },
			})

			if (!superSetData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'SuperSet not found',
				})
			}

			if (!superSetData.isSuperSet) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'The specified exercise is not marked as a superset',
				})
			}

			const [link] = await db
				.insert(workoutToSuperSet)
				.values({
					workoutId: input.workoutId,
					superSetId: input.superSetId,
					index: input.index,
				})
				.returning()

			return link
		}),

	removeSuperSet: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/workout/superset/remove',
			summary: 'Remove a superset from a workout',
			tags: ['Workout'],
		})
		.input(WorkoutRemoveSuperSetInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify workouts',
				})
			}

			await db
				.delete(workoutToSuperSet)
				.where(
					and(
						eq(workoutToSuperSet.workoutId, input.workoutId),
						eq(workoutToSuperSet.superSetId, input.superSetId),
					),
				)

			return { success: true }
		}),
}
