import { z } from 'zod'

export const AiTestInput = z.object({
	prompt: z.string().min(1),
	model: z.string().min(1).default('minimax-m2.5-free'),
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
	model: z.string().min(1).default('minimax-m2.5-free'),
	currentForm: AiRecipeFormStateInput,
})

export const AiRecipeUpdateOutput = z.object({
	form: AiRecipeFormStateInput,
})
