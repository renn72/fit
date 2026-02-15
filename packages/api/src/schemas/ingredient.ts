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
