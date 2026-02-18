import { db } from '@fit/db'
import { ingredient } from '@fit/db/schema/ingredient'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	IngredientCreateInput,
	IngredientGetAllBaseInput,
	IngredientGetAllInput,
	IngredientGetAllOrgInput,
	IngredientGetInput,
	IngredientUpdateInput,
} from '../schemas/ingredient'

export const ingredientRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/ingredient/all',
			summary: 'Get all ingredients (Dictator only)',
			tags: ['Ingredient'],
		})
		.input(IngredientGetAllInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all ingredients',
				})
			}

			const res = await db.query.ingredient.findMany({
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

			return res.map((i) => ({
				...i,
				organisationSlug: i.organisation?.slug,
				creatorName: i.creator?.name ?? 'Unknown',
			}))
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/ingredient',
			summary: 'Create an ingredient',
			tags: ['Ingredient'],
		})
		.input(IngredientCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create ingredients',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newIngredient] = await db
				.insert(ingredient)
				.values({
					...input,
					calories: Math.round(input.calories * 10) / 10,
					protein: Math.round(input.protein * 10) / 10,
					fat: Math.round(input.fat * 10) / 10,
					carbohydrate: Math.round(input.carbohydrate * 10) / 10,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newIngredient
		}),

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/ingredient/org',
			summary: 'Get all ingredients for an organisation',
			tags: ['Ingredient'],
		})
		.input(IngredientGetAllOrgInput)
		.handler(async ({ input }) => {
			// Get org ingredients
			const orgIngredients = await db.query.ingredient.findMany({
				where: { organisationId: input.organisationId },
			})

			const overwrittenBaseIds = orgIngredients
				.map((i) => i.baseId)
				.filter((id): id is string => id !== null)

			// Get base ingredients (isBase=true, not overwritten by org)
			const baseIngs = await db.query.ingredient.findMany({
				where: { isBase: true },
			})

			const availableBaseIngredients = baseIngs.filter(
				(bi) => !overwrittenBaseIds.includes(bi.id),
			)

			const allIngredients = [
				...orgIngredients.map((i) => ({
					...i,
					isBase: false,
					isOverwriteBase: !!i.baseId,
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
			const ing = await db.query.ingredient.findFirst({
				where: { id: input.id },
			})

			return ing || null
		}),

	getAllBase: protectedProcedure
		.route({
			method: 'GET',
			path: '/ingredient/base',
			summary: 'Get all base ingredients',
			tags: ['Ingredient'],
		})
		.input(IngredientGetAllBaseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view base ingredients',
				})
			}

			const res = await db.query.ingredient.findMany({
				where: { isBase: true },
				limit: input.limit,
			})
			return res
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/ingredient',
			summary: 'Update an ingredient',
			tags: ['Ingredient'],
		})
		.input(IngredientUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update ingredients',
				})
			}

			const organisationId = context.session.user.organisationId
			if (!organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			// 1. Check if it's an existing org ingredient
			const existingOrgIngredient = await db.query.ingredient.findFirst({
				where: {
					id: input.id,
					organisationId: organisationId,
				},
			})

			if (existingOrgIngredient) {
				const [updated] = await db
					.update(ingredient)
					.set({
						name: input.name,
						calories: Math.round(input.calories * 10) / 10,
						protein: Math.round(input.protein * 10) / 10,
						fat: Math.round(input.fat * 10) / 10,
						carbohydrate: Math.round(input.carbohydrate * 10) / 10,
						serveSize: input.serveSize,
						serveUnit: input.serveUnit,
					})
					.where(eq(ingredient.id, input.id))
					.returning()
				return updated
			}

			// 2. Check if it's a base ingredient (to create an override)
			const baseIng = await db.query.ingredient.findFirst({
				where: {
					id: input.id,
					isBase: true,
				},
			})

			if (baseIng) {
				const [newOverride] = await db
					.insert(ingredient)
					.values({
						name: input.name,
						calories: Math.round(input.calories * 10) / 10,
						protein: Math.round(input.protein * 10) / 10,
						fat: Math.round(input.fat * 10) / 10,
						carbohydrate: Math.round(input.carbohydrate * 10) / 10,
						serveSize: input.serveSize,
						serveUnit: input.serveUnit,
						baseId: baseIng.id,
						organisationId,
						creatorId: context.session.user.id,
					})
					.returning()
				return newOverride
			}

			throw new ORPCError('NOT_FOUND', {
				message: 'Ingredient not found',
			})
		}),
}
