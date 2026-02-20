import { db } from '@fit/db'
import {
	menuTemplate,
	menuTemplateToRecipe,
} from '@fit/db/schema/menu-template'

import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	MenuTemplateAddRecipeInput,
	MenuTemplateCreateInput,
	MenuTemplateDeleteInput,
	MenuTemplateGetAllOrgInput,
	MenuTemplateGetInput,
	MenuTemplateRemoveRecipeInput,
	MenuTemplateUpdateInput,
} from '../schemas/menu-template'

export const menuTemplateRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/menu-template/all',
			summary:
				'Get all menu templates across all organisations (dictator only)',
			tags: ['Menu Template'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only dictators can view all menu templates',
				})
			}

			const menuTemplates = await db.query.menuTemplate.findMany({
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
					recipes: {
						with: {
							recipe: true,
						},
						orderBy: (link, { asc }) => [
							asc(link.mealIndex),
							asc(link.recipeIndex),
						],
					},
				},
				orderBy: (menuTemplate, { desc }) => [desc(menuTemplate.createdAt)],
			})

			return menuTemplates.map((mt) => ({
				...mt,
				creatorName: mt.creator?.name ?? null,
				creatorEmail: mt.creator?.email ?? null,
				organisationName: mt.organisation?.name ?? null,
				organisationSlug: mt.organisation?.slug ?? null,
			}))
		}),

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/menu-template/org',
			summary: 'Get all menu templates for an organisation',
			tags: ['Menu Template'],
		})
		.input(MenuTemplateGetAllOrgInput)
		.handler(async ({ input, context }) => {
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to view menu templates for this organisation',
				})
			}

			const menuTemplates = await db.query.menuTemplate.findMany({
				where: { organisationId: input.organisationId },
				with: {
					creator: {
						columns: {
							name: true,
						},
					},
					recipes: {
						with: {
							recipe: true,
						},
						orderBy: (link, { asc }) => [
							asc(link.mealIndex),
							asc(link.recipeIndex),
						],
					},
				},
				orderBy: (menuTemplate, { desc }) => [desc(menuTemplate.createdAt)],
			})

			return menuTemplates
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/menu-template/:id',
			summary: 'Get a menu template by ID with all recipes',
			tags: ['Menu Template'],
		})
		.input(MenuTemplateGetInput)
		.handler(async ({ input, context }) => {
			const menuTemplateData = await db.query.menuTemplate.findFirst({
				where: { id: input.id },
				with: {
					recipes: {
						with: {
							recipe: true,
						},
						orderBy: (link, { asc }) => [
							asc(link.mealIndex),
							asc(link.recipeIndex),
						],
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			if (!menuTemplateData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Menu template not found',
				})
			}

			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (menuTemplateData.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view this menu template',
				})
			}

			return menuTemplateData
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/menu-template',
			summary: 'Create a menu template',
			tags: ['Menu Template'],
		})
		.input(MenuTemplateCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create menu templates',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newMenuTemplate] = await db
				.insert(menuTemplate)
				.values({
					...input,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newMenuTemplate
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/menu-template',
			summary: 'Update a menu template',
			tags: ['Menu Template'],
		})
		.input(MenuTemplateUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update menu templates',
				})
			}

			const { id, ...updateData } = input

			const [updated] = await db
				.update(menuTemplate)
				.set(updateData)
				.where(eq(menuTemplate.id, id))
				.returning()

			if (!updated) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Menu template not found',
				})
			}

			return updated
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/menu-template/:id',
			summary: 'Delete a menu template',
			tags: ['Menu Template'],
		})
		.input(MenuTemplateDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete menu templates',
				})
			}

			await db.delete(menuTemplate).where(eq(menuTemplate.id, input.id))
			return { success: true, id: input.id }
		}),

	// ***************** Menu Template Recipe Operations *******************
	addRecipe: protectedProcedure
		.route({
			method: 'POST',
			path: '/menu-template/recipe/add',
			summary: 'Add a recipe to a menu template',
			tags: ['Menu Template'],
		})
		.input(MenuTemplateAddRecipeInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify menu templates',
				})
			}

			// Verify menu template exists
			const menuTemplateData = await db.query.menuTemplate.findFirst({
				where: { id: input.menuTemplateId },
			})

			if (!menuTemplateData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Menu template not found',
				})
			}

			// Verify recipe exists
			const recipeData = await db.query.recipe.findFirst({
				where: { id: input.recipeId },
			})

			if (!recipeData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Recipe not found',
				})
			}

			const [link] = await db
				.insert(menuTemplateToRecipe)
				.values({
					menuTemplateId: input.menuTemplateId,
					recipeId: input.recipeId,
					mealIndex: input.mealIndex,
					recipeIndex: input.recipeIndex,
				})
				.returning()

			return link
		}),

	removeRecipe: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/menu-template/recipe/remove',
			summary: 'Remove a recipe from a menu template',
			tags: ['Menu Template'],
		})
		.input(MenuTemplateRemoveRecipeInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify menu templates',
				})
			}

			await db
				.delete(menuTemplateToRecipe)
				.where(
					and(
						eq(menuTemplateToRecipe.menuTemplateId, input.menuTemplateId),
						eq(menuTemplateToRecipe.recipeId, input.recipeId),
					),
				)

			return { success: true }
		}),
}
