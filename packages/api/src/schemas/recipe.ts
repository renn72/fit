import { z } from 'zod'

export const RecipeGetInput = z.object({
	id: z.string().min(1),
})

export const RecipeGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
	limit: z.number().optional(),
})

export const RecipeGetAllAdminInput = z.object({
	limit: z.number().optional(),
})

export const RecipeIngredientInput = z
	.object({
		ingredientId: z.string().optional(),
		customIngredientId: z.string().optional(),
		altIngredientId: z.string().optional().nullable(),
		altBaseIngredientId: z.string().optional().nullable(),
		amount: z.number().min(0),
		unit: z.string().min(1),
	})
	.refine((data) => data.ingredientId || data.customIngredientId, {
		message: 'Either ingredientId or customIngredientId is required',
	})

export const RecipeCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	image: z.string().optional().nullable(),
	metaTags: z.string().optional().nullable(),
	ingredients: z.array(RecipeIngredientInput).optional(),
})

export const RecipeUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	image: z.string().optional().nullable(),
	metaTags: z.string().optional().nullable(),
})

export const RecipeDeleteInput = z.object({
	id: z.string().min(1),
})
