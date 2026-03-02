import { z } from 'zod'

export const IngredientGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
	limit: z.number().optional(),
})

export const IngredientGetInput = z.object({
	id: z.string().min(1),
})

export const IngredientGetAllBaseInput = z.object({
	limit: z.number().optional(),
})

export const IngredientGetAllInput = z.object({
	limit: z.number().optional(),
})

export const IngredientCreateInput = z.object({
	name: z.string().min(1),
	category: z.string().optional().nullable(),
	calories: z.number().min(0),
	protein: z.number().min(0),
	fat: z.number().min(0),
	carbohydrate: z.number().min(0),
	serveSize: z.number().min(0),
	serveUnit: z.string().min(1),
	baseId: z.string().optional().nullable(),
})

export const IngredientUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	category: z.string().optional().nullable(),
	calories: z.number().min(0),
	protein: z.number().min(0),
	fat: z.number().min(0),
	carbohydrate: z.number().min(0),
	serveSize: z.number().min(0),
	serveUnit: z.string().min(1),
})

export const IngredientDeleteInput = z.object({
	id: z.string().min(1),
})
