import { db } from '@fit/db'
import { baseIngredients, ingredient } from '@fit/db/schema/ingredient'

import z from 'zod'
import { protectedProcedure } from '../index'

export const ingredientRouter = {
	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/ingredient/org',
			summary: 'Get all ingredients for an organisation',
			tags: ['Ingredient'],
		})
		.input(
			z.object({
				organisationId: z.string().min(1),
				limit: z.number().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const orgIngredients = await db.query.ingredient.findMany({
				where: { organisationId: input.organisationId },
			})

			const overwrittenBaseIds = orgIngredients
				.map((i) => i.baseIngredientId)
				.filter((id): id is string => id !== null)

			const baseIngs = await db.query.baseIngredients.findMany()

			const availableBaseIngredients = baseIngs.filter(
				(bi) => !overwrittenBaseIds.includes(bi.id),
			)

			const allIngredients = [...orgIngredients, ...availableBaseIngredients]

			if (input.limit) {
				return allIngredients.slice(0, input.limit)
			}

			return allIngredients
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/ingredient/:id',
			summary: 'Get an ingredient by ID',
			tags: ['Ingredient'],
		})
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const orgIngredient = await db.query.ingredient.findFirst({
				where: { id: input.id },
			})

			if (orgIngredient) return orgIngredient

			const baseIng = await db.query.baseIngredients.findFirst({
				where: { id: input.id },
			})

			return baseIng || null
		}),

	getAllBase: protectedProcedure
		.route({
			method: 'GET',
			path: '/ingredient/base',
			summary: 'Get all base ingredients',
			tags: ['Ingredient'],
		})
		.input(z.object({ limit: z.number().optional() }))
		.handler(async ({ input }) => {
			const res = await db.query.baseIngredients.findMany({
				limit: input.limit,
			})
			return res
		}),
}
