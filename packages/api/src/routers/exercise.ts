import { db } from '@fit/db'

import { protectedProcedure } from '../index'
import {
	ExerciseGetAllBaseInput,
	ExerciseGetAllOrgInput,
	ExerciseGetInput,
} from '../schemas/exercise'

export const exerciseRouter = {
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

			const allExercises = [...orgExercises, ...availableBaseExercises]

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
		.handler(async ({ input }) => {
			const res = await db.query.baseExercise.findMany({
				limit: input.limit,
			})
			return res
		}),
}
