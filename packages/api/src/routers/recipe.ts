import { db } from '@fit/db'
import { recipe } from '@fit/db/schema/recipe'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	RecipeCreateInput,
	RecipeDeleteInput,
	RecipeGetAllAdminInput,
	RecipeGetAllOrgInput,
	RecipeGetInput,
	RecipeUpdateInput,
} from '../schemas/recipe'

export const recipeRouter = {
	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/recipe/:id',
			summary: 'Get a recipe by ID',
			tags: ['Recipe'],
		})
		.input(RecipeGetInput)
		.handler(async ({ input, context }) => {
			const recipeData = await db.query.recipe.findFirst({
				where: { id: input.id },
				with: {
					ingredients: {
						with: {
							ingredient: true,
							altIngredient: true,
						},
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			if (!recipeData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Recipe not found',
				})
			}

			// Check if user has access to this recipe's organisation
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (recipeData.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view this recipe',
				})
			}

			return recipeData
		}),

	getOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/recipe/org',
			summary: 'Get all recipes for an organisation',
			tags: ['Recipe'],
		})
		.input(RecipeGetAllOrgInput)
		.handler(async ({ input, context }) => {
			// Verify user belongs to this organisation or is dictator
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to view recipes for this organisation',
				})
			}

			const recipes = await db.query.recipe.findMany({
				where: { organisationId: input.organisationId },
				limit: input.limit,
				with: {
					ingredients: {
						with: {
							ingredient: true,
						},
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			return recipes
		}),

	getAllAdmin: protectedProcedure
		.route({
			method: 'GET',
			path: '/recipe/all',
			summary: 'Get all recipes (Dictator only)',
			tags: ['Recipe'],
		})
		.input(RecipeGetAllAdminInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all recipes',
				})
			}

			const recipes = await db.query.recipe.findMany({
				limit: input.limit,
				with: {
					organisation: {
						columns: {
							slug: true,
							name: true,
						},
					},
					creator: {
						columns: {
							name: true,
						},
					},
					ingredients: {
						with: {
							ingredient: true,
						},
					},
				},
			})

			return recipes.map((r) => ({
				...r,
				organisationSlug: r.organisation?.slug,
				organisationName: r.organisation?.name,
				creatorName: r.creator?.name ?? 'Unknown',
			}))
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/recipe',
			summary: 'Create a recipe',
			tags: ['Recipe'],
		})
		.input(RecipeCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create recipes',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newRecipe] = await db
				.insert(recipe)
				.values({
					...input,
					metaTags: input.metaTags || '',
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newRecipe
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/recipe',
			summary: 'Update a recipe',
			tags: ['Recipe'],
		})
		.input(RecipeUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update recipes',
				})
			}

			const organisationId = context.session.user.organisationId
			if (!organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			// Check if recipe exists and belongs to user's organisation
			const existingRecipe = await db.query.recipe.findFirst({
				where: {
					id: input.id,
					organisationId: organisationId,
				},
			})

			if (!existingRecipe) {
				throw new ORPCError('NOT_FOUND', {
					message:
						'Recipe not found or you do not have permission to update it',
				})
			}

			const [updatedRecipe] = await db
				.update(recipe)
				.set({
					name: input.name,
					description: input.description,
					category: input.category,
					image: input.image,
					metaTags: input.metaTags || '',
				})
				.where(eq(recipe.id, input.id))
				.returning()

			return updatedRecipe
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/recipe',
			summary: 'Delete a recipe',
			tags: ['Recipe'],
		})
		.input(RecipeDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete recipes',
				})
			}

			const organisationId = context.session.user.organisationId
			const isDictator = metaTags.includes('dictator')

			// For non-dictators, verify the recipe belongs to their organisation
			if (!isDictator && organisationId) {
				const existingRecipe = await db.query.recipe.findFirst({
					where: {
						id: input.id,
						organisationId: organisationId,
					},
				})

				if (!existingRecipe) {
					throw new ORPCError('NOT_FOUND', {
						message:
							'Recipe not found or you do not have permission to delete it',
					})
				}
			}

			await db.delete(recipe).where(eq(recipe.id, input.id))

			return { success: true, id: input.id }
		}),
}
