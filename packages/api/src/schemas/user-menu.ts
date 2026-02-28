import { z } from 'zod'

// ***************** User Menu *******************
export const UserMenuGetByUserInput = z.object({
	userId: z.string().min(1),
})

export const UserMenuGetTemplatesOrgInput = z.object({
	organisationId: z.string().min(1),
})

export const UserMenuGetInput = z.object({
	id: z.string().min(1),
})

export const UserMenuCreateInput = z.object({
	userId: z.string().min(1),
	menuTemplateId: z.string().optional().nullable(),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
})

export const UserMenuUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	isActive: z.boolean().optional(),
})

export const UserMenuDeleteInput = z.object({
	id: z.string().min(1),
})

export const UserMenuTemplateCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	meals: z.array(
		z.object({
			mealIndex: z.number().int().min(0),
			name: z.string().min(1),
			recipes: z.array(
				z.object({
					recipeId: z.string().min(1),
					recipeIndex: z.number().int().min(0),
				}),
			),
		}),
	),
})

// ***************** User Meal *******************
export const UserMealCreateInput = z.object({
	userMenuId: z.string().min(1),
	mealIndex: z.number().int().min(0),
	name: z.string().optional().nullable(),
	calories: z.number().optional().nullable(),
	protein: z.number().optional().nullable(),
	fat: z.number().optional().nullable(),
	carbohydrate: z.number().optional().nullable(),
})

export const UserMealUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().optional().nullable(),
	calories: z.number().optional().nullable(),
	protein: z.number().optional().nullable(),
	fat: z.number().optional().nullable(),
	carbohydrate: z.number().optional().nullable(),
})

export const UserMealDeleteInput = z.object({
	id: z.string().min(1),
})

// ***************** User Recipe *******************
export const UserRecipeCreateInput = z.object({
	userMenuId: z.string().min(1),
	mealIndex: z.number().int().min(0),
	recipeIndex: z.number().int().min(0),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	image: z.string().optional().nullable(),
	instructions: z.string().optional().nullable(),
})

export const UserRecipeUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	image: z.string().optional().nullable(),
	instructions: z.string().optional().nullable(),
	prepTime: z.number().int().optional().nullable(),
	cookTime: z.number().int().optional().nullable(),
	servings: z.number().int().optional().nullable(),
	isCompleted: z.boolean().optional(),
})

export const UserRecipeMarkCompletedInput = z.object({
	id: z.string().min(1),
	isCompleted: z.boolean(),
})

export const UserRecipeDeleteInput = z.object({
	id: z.string().min(1),
})

// ***************** User Ingredient *******************
export const UserIngredientCreateInput = z.object({
	userMenuId: z.string().min(1),
	userRecipeId: z.string().min(1),
	ingredientId: z.string().min(1),
	mealIndex: z.number().int().min(0),
	recipeIndex: z.number().int().min(0),
	serveSize: z.number(),
	serveUnit: z.string().min(1),
	altServeSize: z.number().optional().nullable(),
	altServeUnit: z.string().optional().nullable(),
})

export const UserIngredientUpdateInput = z.object({
	id: z.string().min(1),
	serveSize: z.number().optional(),
	serveUnit: z.string().optional(),
	altServeSize: z.number().optional().nullable(),
	altServeUnit: z.string().optional().nullable(),
})

export const UserIngredientSwapInput = z.object({
	id: z.string().min(1),
	altIngredientId: z.string().min(1),
	altServeSize: z.number().optional(),
	altServeUnit: z.string().optional(),
})

export const UserIngredientMarkCompletedInput = z.object({
	id: z.string().min(1),
	isCompleted: z.boolean(),
})

export const UserIngredientDeleteInput = z.object({
	id: z.string().min(1),
})

// ***************** Batch Create Menu (Full Menu with Meals, Recipes, Ingredients) *******************
export const UserMenuBatchCreateInput = z.object({
	userId: z.string().min(1),
	menuTemplateId: z.string().optional().nullable(),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	meals: z.array(
		z.object({
			mealIndex: z.number().int().min(0),
			name: z.string().optional().nullable(),
			calories: z.number(),
			protein: z.number(),
			fat: z.number(),
			carbohydrate: z.number(),
			recipes: z.array(
				z.object({
					recipeIndex: z.number().int().min(0),
					name: z.string().min(1),
					description: z.string().optional().nullable(),
					category: z.string().optional().nullable(),
					image: z.string().optional().nullable(),
					ingredients: z.array(
						z.object({
							ingredientId: z.string().min(1),
							serveSize: z.number(),
							serveUnit: z.string().min(1),
						}),
					),
				}),
			),
		}),
	),
})

// ***************** Batch Update Menu (Delete and Recreate) *******************
export const UserMenuBatchUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	meals: z.array(
		z.object({
			mealIndex: z.number().int().min(0),
			name: z.string().optional().nullable(),
			calories: z.number(),
			protein: z.number(),
			fat: z.number(),
			carbohydrate: z.number(),
			recipes: z.array(
				z.object({
					recipeIndex: z.number().int().min(0),
					name: z.string().min(1),
					description: z.string().optional().nullable(),
					category: z.string().optional().nullable(),
					image: z.string().optional().nullable(),
					ingredients: z.array(
						z.object({
							ingredientId: z.string().min(1),
							serveSize: z.number(),
							serveUnit: z.string().min(1),
						}),
					),
				}),
			),
		}),
	),
})
