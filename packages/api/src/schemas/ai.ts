import { z } from 'zod'

export const AiTestInput = z.object({
	prompt: z.string().min(1),
})

export const AiRecipeFormIngredientInput = z
	.object({
		id: z.string().min(1),
		ingredientId: z.string().min(1),
		amount: z.number().positive(),
		unit: z.string().min(1),
		altIngredientId: z.string(),
	})
	.strict()

export const AiRecipeFormStateInput = z
	.object({
		name: z.string(),
		description: z.string(),
		image: z.string(),
		categoryTags: z.array(z.string()),
		metaTags: z.array(z.string()),
		ingredients: z.array(AiRecipeFormIngredientInput),
	})
	.strict()

export const AiRecipeUpdateInput = z.object({
	organisationId: z.string().min(1),
	request: z.string().min(1),
	currentForm: AiRecipeFormStateInput,
})

export const AiRecipeUpdateOutput = z.object({
	form: AiRecipeFormStateInput,
})

export const AiUserMenuFormIngredientInput = z
	.object({
		id: z.string().min(1),
		recipeToIngredientId: z.string(),
		ingredientId: z.string().min(1),
		ingredientName: z.string(),
		serveSize: z.number().nonnegative(),
		serveUnit: z.string(),
		calories: z.number().nonnegative(),
		protein: z.number().nonnegative(),
		fat: z.number().nonnegative(),
		carbohydrate: z.number().nonnegative(),
	})
	.strict()

export const AiUserMenuFormRecipeInput = z
	.object({
		id: z.string().min(1),
		recipeId: z.string(),
		recipeName: z.string(),
		recipeIndex: z.number().int().nonnegative(),
		calories: z.number().nonnegative(),
		protein: z.number().nonnegative(),
		fat: z.number().nonnegative(),
		carbohydrate: z.number().nonnegative(),
		ingredients: z.array(AiUserMenuFormIngredientInput),
	})
	.strict()

export const AiUserMenuFormMealInput = z
	.object({
		id: z.string().min(1),
		mealIndex: z.number().int().nonnegative(),
		name: z.string(),
		targetCalories: z.number().nonnegative().nullable(),
		targetProtein: z.number().nonnegative().nullable(),
		recipes: z.array(AiUserMenuFormRecipeInput),
	})
	.strict()

export const AiUserMenuFormStateInput = z
	.object({
		name: z.string(),
		description: z.string().nullable(),
		startDate: z.string().nullable(),
		endDate: z.string().nullable(),
		meals: z.array(AiUserMenuFormMealInput),
	})
	.strict()

export const AiUserMenuUpdateInput = z.object({
	organisationId: z.string().min(1),
	request: z.string().min(1),
	currentForm: AiUserMenuFormStateInput,
})

export const AiUserMenuUpdateOutput = z.object({
	form: AiUserMenuFormStateInput,
})
