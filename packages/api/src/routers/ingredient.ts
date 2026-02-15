import { db } from '@fit/db'

import { protectedProcedure } from '../index'
import {
	IngredientGetAllBaseInput,
	IngredientGetAllOrgInput,
	IngredientGetInput,
} from '../schemas/ingredient'

export const ingredientRouter = {
	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/ingredient/org',
			summary: 'Get all ingredients for an organisation',
			tags: ['Ingredient'],
		})
		.input(IngredientGetAllOrgInput)
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

			const allIngredients = [
				...orgIngredients.map((i) => ({
					...i,
					isBase: false,
					isOverwriteBase: !!i.baseIngredientId,
				})),
				...availableBaseIngredients.map((bi) => ({
					...bi,
					isBase: true,
					isOverwriteBase: false,
				})),
			]

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
		.input(IngredientGetInput)
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
		.input(IngredientGetAllBaseInput)
		.handler(async ({ input }) => {
			const res = await db.query.baseIngredients.findMany({
				limit: input.limit,
			})
			return res
		}),
}
