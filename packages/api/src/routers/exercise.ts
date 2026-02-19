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
	SuperSetGetExercisesInput,
	SuperSetRemoveExerciseInput,
} from '../schemas/exercise'

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
				},
				orderBy: (exercise, { desc }) => [desc(exercise.createdAt)],
			})

			return exercises.map((e) => ({
				...e,
				movementName: e.movement?.name ?? null,
				creatorName: e.creator?.name ?? null,
				creatorEmail: e.creator?.email ?? null,
				organisationName: e.organisation?.name ?? null,
				organisationSlug: e.organisation?.slug ?? null,
			}))
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
				},
			})

			return exercises.map((e) => ({
				...e,
				movementName: e.movement?.name ?? null,
			}))
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
				},
			})

			return ex || null
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

			return updated
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
