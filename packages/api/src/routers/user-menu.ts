import { db } from '@fit/db'
import {
	userIngredient,
	userMeal,
	userMenu,
	userRecipe,
} from '@fit/db/schema/user-menu'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	UserIngredientCreateInput,
	UserIngredientDeleteInput,
	UserIngredientMarkCompletedInput,
	UserIngredientSwapInput,
	UserIngredientUpdateInput,
	UserMealCreateInput,
	UserMealDeleteInput,
	UserMealUpdateInput,
	UserMenuCreateInput,
	UserMenuDeleteInput,
	UserMenuGetByUserInput,
	UserMenuGetInput,
	UserMenuUpdateInput,
	UserRecipeCreateInput,
	UserRecipeDeleteInput,
	UserRecipeMarkCompletedInput,
	UserRecipeUpdateInput,
} from '../schemas/user-menu'

export const userMenuRouter = {
	// ***************** User Menu *******************
	getByUser: protectedProcedure
		.route({
			method: 'GET',
			path: '/user-menu/by-user',
			summary: 'Get all user menus for a specific user',
			tags: ['User Menu'],
		})
		.input(UserMenuGetByUserInput)
		.handler(async ({ input, context }) => {
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			// Check if requesting user belongs to same org or is dictator
			if (input.userId !== context.session.user.id && !isDictator) {
				// Check if target user is in same organization
				const targetUser = await db.query.user.findFirst({
					where: { id: input.userId },
				})
				if (!targetUser || targetUser.organisationId !== userOrgId) {
					throw new ORPCError('FORBIDDEN', {
						message: 'You do not have permission to view menus for this user',
					})
				}
			}

			const menus = await db.query.userMenu.findMany({
				where: { userId: input.userId },
				with: {
					meals: {
						orderBy: (meal, { asc }) => [asc(meal.mealIndex)],
					},
					recipes: {
						orderBy: (recipe, { asc }) => [
							asc(recipe.mealIndex),
							asc(recipe.recipeIndex),
						],
					},
					ingredients: true,
				},
				orderBy: (menu, { desc }) => [desc(menu.createdAt)],
			})

			return menus
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/user-menu/:id',
			summary: 'Get a user menu by ID with all nested data',
			tags: ['User Menu'],
		})
		.input(UserMenuGetInput)
		.handler(async ({ input, context }) => {
			const menu = await db.query.userMenu.findFirst({
				where: { id: input.id },
				with: {
					meals: {
						orderBy: (meal, { asc }) => [asc(meal.mealIndex)],
					},
					recipes: {
						orderBy: (recipe, { asc }) => [
							asc(recipe.mealIndex),
							asc(recipe.recipeIndex),
						],
					},
					ingredients: true,
				},
			})

			if (!menu) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User menu not found',
				})
			}

			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (menu.userId !== context.session.user.id && !isDictator) {
				// Check if menu belongs to user in same organization
				const menuUser = await db.query.user.findFirst({
					where: { id: menu.userId },
				})
				if (!menuUser || menuUser.organisationId !== userOrgId) {
					throw new ORPCError('FORBIDDEN', {
						message: 'You do not have permission to view this menu',
					})
				}
			}

			return menu
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu',
			summary: 'Create a user menu assignment',
			tags: ['User Menu'],
		})
		.input(UserMenuCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			// Users can only create menus for themselves unless they're a dictator
			if (input.userId !== context.session.user.id && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only create menus for yourself',
				})
			}

			const [newMenu] = await db
				.insert(userMenu)
				.values({
					...input,
					startDate: input.startDate || new Date(),
				})
				.returning()

			if (!newMenu) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'Failed to create user menu',
				})
			}

			return newMenu
		}),

	update: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/update',
			summary: 'Update a user menu',
			tags: ['User Menu'],
		})
		.input(UserMenuUpdateInput)
		.handler(async ({ input, context }) => {
			const { id, ...updates } = input

			const existingMenu = await db.query.userMenu.findFirst({
				where: { id },
			})

			if (!existingMenu) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User menu not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (existingMenu.userId !== context.session.user.id && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only update your own menus',
				})
			}

			const [updatedMenu] = await db
				.update(userMenu)
				.set(updates)
				.where(eq(userMenu.id, id))
				.returning()

			return updatedMenu
		}),

	delete: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/delete',
			summary: 'Delete a user menu',
			tags: ['User Menu'],
		})
		.input(UserMenuDeleteInput)
		.handler(async ({ input, context }) => {
			const existingMenu = await db.query.userMenu.findFirst({
				where: { id: input.id },
			})

			if (!existingMenu) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User menu not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (existingMenu.userId !== context.session.user.id && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only delete your own menus',
				})
			}

			await db.delete(userMenu).where(eq(userMenu.id, input.id))

			return { success: true }
		}),

	// ***************** User Meal *******************
	createMeal: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/meal',
			summary: 'Create a meal for a user menu',
			tags: ['User Menu'],
		})
		.input(UserMealCreateInput)
		.handler(async ({ input, context }) => {
			const menu = await db.query.userMenu.findFirst({
				where: { id: input.userMenuId },
			})

			if (!menu) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User menu not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (menu.userId !== context.session.user.id && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only add meals to your own menus',
				})
			}

			const [newMeal] = await db.insert(userMeal).values(input).returning()

			if (!newMeal) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'Failed to create meal',
				})
			}

			return newMeal
		}),

	updateMeal: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/meal/update',
			summary: 'Update a meal',
			tags: ['User Menu'],
		})
		.input(UserMealUpdateInput)
		.handler(async ({ input, context }) => {
			const { id, ...updates } = input

			const meal = await db.query.userMeal.findFirst({
				where: { id },
				with: {
					userMenu: true,
				},
			})

			if (!meal) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Meal not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!meal.userMenu ||
				(meal.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only update meals in your own menus',
				})
			}

			const [updatedMeal] = await db
				.update(userMeal)
				.set(updates)
				.where(eq(userMeal.id, id))
				.returning()

			return updatedMeal
		}),

	deleteMeal: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/meal/delete',
			summary: 'Delete a meal',
			tags: ['User Menu'],
		})
		.input(UserMealDeleteInput)
		.handler(async ({ input, context }) => {
			const meal = await db.query.userMeal.findFirst({
				where: { id: input.id },
				with: {
					userMenu: true,
				},
			})

			if (!meal) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Meal not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!meal.userMenu ||
				(meal.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only delete meals from your own menus',
				})
			}

			await db.delete(userMeal).where(eq(userMeal.id, input.id))

			return { success: true }
		}),

	// ***************** User Recipe *******************
	createRecipe: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/recipe',
			summary: 'Create a recipe for a user menu',
			tags: ['User Menu'],
		})
		.input(UserRecipeCreateInput)
		.handler(async ({ input, context }) => {
			const menu = await db.query.userMenu.findFirst({
				where: { id: input.userMenuId },
			})

			if (!menu) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User menu not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (menu.userId !== context.session.user.id && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only add recipes to your own menus',
				})
			}

			const [newRecipe] = await db.insert(userRecipe).values(input).returning()

			if (!newRecipe) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'Failed to create recipe',
				})
			}

			return newRecipe
		}),

	updateRecipe: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/recipe/update',
			summary: 'Update a recipe',
			tags: ['User Menu'],
		})
		.input(UserRecipeUpdateInput)
		.handler(async ({ input, context }) => {
			const { id, ...updates } = input

			const recipe = await db.query.userRecipe.findFirst({
				where: { id },
				with: {
					userMenu: true,
				},
			})

			if (!recipe) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Recipe not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!recipe.userMenu ||
				(recipe.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only update recipes in your own menus',
				})
			}

			const [updatedRecipe] = await db
				.update(userRecipe)
				.set(updates)
				.where(eq(userRecipe.id, id))
				.returning()

			return updatedRecipe
		}),

	markRecipeCompleted: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/recipe/mark-completed',
			summary: 'Mark a recipe as completed or not',
			tags: ['User Menu'],
		})
		.input(UserRecipeMarkCompletedInput)
		.handler(async ({ input, context }) => {
			const recipe = await db.query.userRecipe.findFirst({
				where: { id: input.id },
				with: {
					userMenu: true,
				},
			})

			if (!recipe) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Recipe not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!recipe.userMenu ||
				(recipe.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only mark recipes in your own menus',
				})
			}

			const [updatedRecipe] = await db
				.update(userRecipe)
				.set({
					isCompleted: input.isCompleted,
					completedAt: input.isCompleted ? new Date() : null,
				})
				.where(eq(userRecipe.id, input.id))
				.returning()

			return updatedRecipe
		}),

	deleteRecipe: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/recipe/delete',
			summary: 'Delete a recipe',
			tags: ['User Menu'],
		})
		.input(UserRecipeDeleteInput)
		.handler(async ({ input, context }) => {
			const recipe = await db.query.userRecipe.findFirst({
				where: { id: input.id },
				with: {
					userMenu: true,
				},
			})

			if (!recipe) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Recipe not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!recipe.userMenu ||
				(recipe.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only delete recipes from your own menus',
				})
			}

			await db.delete(userRecipe).where(eq(userRecipe.id, input.id))

			return { success: true }
		}),

	// ***************** User Ingredient *******************
	createIngredient: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/ingredient',
			summary: 'Create an ingredient assignment',
			tags: ['User Menu'],
		})
		.input(UserIngredientCreateInput)
		.handler(async ({ input, context }) => {
			const menu = await db.query.userMenu.findFirst({
				where: { id: input.userMenuId },
			})

			if (!menu) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User menu not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (menu.userId !== context.session.user.id && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only add ingredients to your own menus',
				})
			}

			const [newIngredient] = await db
				.insert(userIngredient)
				.values(input)
				.returning()

			if (!newIngredient) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'Failed to create ingredient',
				})
			}

			return newIngredient
		}),

	updateIngredient: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/ingredient/update',
			summary: 'Update an ingredient assignment',
			tags: ['User Menu'],
		})
		.input(UserIngredientUpdateInput)
		.handler(async ({ input, context }) => {
			const { id, ...updates } = input

			const ingredient = await db.query.userIngredient.findFirst({
				where: { id },
				with: {
					userMenu: true,
				},
			})

			if (!ingredient) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Ingredient not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!ingredient.userMenu ||
				(ingredient.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only update ingredients in your own menus',
				})
			}

			const [updatedIngredient] = await db
				.update(userIngredient)
				.set(updates)
				.where(eq(userIngredient.id, id))
				.returning()

			return updatedIngredient
		}),

	swapIngredient: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/ingredient/swap',
			summary: 'Swap an ingredient for an alternative',
			tags: ['User Menu'],
		})
		.input(UserIngredientSwapInput)
		.handler(async ({ input, context }) => {
			const ingredient = await db.query.userIngredient.findFirst({
				where: { id: input.id },
				with: {
					userMenu: true,
				},
			})

			if (!ingredient) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Ingredient not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!ingredient.userMenu ||
				(ingredient.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only swap ingredients in your own menus',
				})
			}

			const [updatedIngredient] = await db
				.update(userIngredient)
				.set({
					altIngredientId: input.altIngredientId,
					altServeSize: input.altServeSize,
					altServeUnit: input.altServeUnit,
				})
				.where(eq(userIngredient.id, input.id))
				.returning()

			return updatedIngredient
		}),

	markIngredientCompleted: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/ingredient/mark-completed',
			summary: 'Mark an ingredient as completed or not',
			tags: ['User Menu'],
		})
		.input(UserIngredientMarkCompletedInput)
		.handler(async ({ input, context }) => {
			const ingredient = await db.query.userIngredient.findFirst({
				where: { id: input.id },
				with: {
					userMenu: true,
				},
			})

			if (!ingredient) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Ingredient not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!ingredient.userMenu ||
				(ingredient.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only mark ingredients in your own menus',
				})
			}

			const [updatedIngredient] = await db
				.update(userIngredient)
				.set({
					isCompleted: input.isCompleted,
					completedAt: input.isCompleted ? new Date() : null,
				})
				.where(eq(userIngredient.id, input.id))
				.returning()

			return updatedIngredient
		}),

	deleteIngredient: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-menu/ingredient/delete',
			summary: 'Delete an ingredient assignment',
			tags: ['User Menu'],
		})
		.input(UserIngredientDeleteInput)
		.handler(async ({ input, context }) => {
			const ingredient = await db.query.userIngredient.findFirst({
				where: { id: input.id },
				with: {
					userMenu: true,
				},
			})

			if (!ingredient) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Ingredient not found',
				})
			}

			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (
				!ingredient.userMenu ||
				(ingredient.userMenu.userId !== context.session.user.id && !isDictator)
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You can only delete ingredients from your own menus',
				})
			}

			await db.delete(userIngredient).where(eq(userIngredient.id, input.id))

			return { success: true }
		}),
}
