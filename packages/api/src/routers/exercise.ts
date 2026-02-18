import { db } from '@fit/db'
import { exercise } from '@fit/db/schema/exercise'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	ExerciseCreateInput,
	ExerciseGetAllBaseInput,
	ExerciseGetAllInput,
	ExerciseGetAllOrgInput,
	ExerciseGetInput,
	ExerciseUpdateInput,
} from '../schemas/exercise'

export const exerciseRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/exercise/all',
			summary: 'Get all exercises (Dictator only)',
			tags: ['Exercise'],
		})
		.input(ExerciseGetAllInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all exercises',
				})
			}

			const res = await db.query.exercise.findMany({
				limit: input.limit,
				with: {
					organisation: {
						columns: {
							slug: true,
						},
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			return res.map((e) => ({
				...e,
				organisationSlug: e.organisation?.slug,
				creatorName: e.creator?.name ?? 'Unknown',
			}))
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

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/exercise/org',
			summary: 'Get all exercises for an organisation',
			tags: ['Exercise'],
		})
		.input(ExerciseGetAllOrgInput)
		.handler(async ({ input }) => {
			const orgExercises = await db.query.exercise.findMany({
				where: { organisationId: input.organisationId },
			})

			const overwrittenBaseIds = orgExercises
				.map((e) => e.baseExerciseId)
				.filter((id): id is string => id !== null)

			const baseExercises = await db.query.baseExercise.findMany()

			const availableBaseExercises = baseExercises.filter(
				(be) => !overwrittenBaseIds.includes(be.id),
			)

			const allExercises = [
				...orgExercises.map((e) => ({
					...e,
					isBase: false,
					isOverwriteBase: !!e.baseExerciseId,
				})),
				...availableBaseExercises.map((be) => ({
					...be,
					isBase: true,
					isOverwriteBase: false,
				})),
			]

			if (input.limit) {
				return allExercises.slice(0, input.limit)
			}

			return allExercises
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
			const orgExercise = await db.query.exercise.findFirst({
				where: { id: input.id },
			})

			if (orgExercise) return orgExercise

			const baseEx = await db.query.baseExercise.findFirst({
				where: { id: input.id },
			})

			return baseEx || null
		}),

	getAllBase: protectedProcedure
		.route({
			method: 'GET',
			path: '/exercise/base',
			summary: 'Get all base exercises',
			tags: ['Exercise'],
		})
		.input(ExerciseGetAllBaseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view base exercises',
				})
			}

			const res = await db.query.baseExercise.findMany({
				limit: input.limit,
			})
			return res
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

			const organisationId = context.session.user.organisationId
			if (!organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			// 1. Check if it's an existing org exercise
			const existingOrgExercise = await db.query.exercise.findFirst({
				where: {
					id: input.id,
					organisationId: organisationId,
				},
			})

			if (existingOrgExercise) {
				const [updated] = await db
					.update(exercise)
					.set({
						name: input.name,
						force: input.force,
						level: input.level,
						mechanic: input.mechanic,
						equipment: input.equipment,
						primaryMuscles: input.primaryMuscles,
						secondaryMuscles: input.secondaryMuscles,
						instructions: input.instructions,
						category: input.category,
						images: input.images,
					})
					.where(eq(exercise.id, input.id))
					.returning()
				return updated
			}

			// 2. Check if it's a base exercise (to create an override)
			const baseEx = await db.query.baseExercise.findFirst({
				where: {
					id: input.id,
				},
			})

			if (baseEx) {
				const [newOverride] = await db
					.insert(exercise)
					.values({
						name: input.name,
						force: input.force,
						level: input.level,
						mechanic: input.mechanic,
						equipment: input.equipment,
						primaryMuscles: input.primaryMuscles,
						secondaryMuscles: input.secondaryMuscles,
						instructions: input.instructions,
						category: input.category,
						images: input.images,
						baseExerciseId: baseEx.id,
						organisationId,
						creatorId: context.session.user.id,
					})
					.returning()
				return newOverride
			}

			throw new ORPCError('NOT_FOUND', {
				message: 'Exercise not found',
			})
		}),
}
