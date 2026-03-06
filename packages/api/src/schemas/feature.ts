import { z } from 'zod'

export const FeatureGetAiAccessInput = z.object({
	organisationId: z.string().min(1),
})

export const FeatureUpdateAppInput = z.object({
	aiEnabled: z.boolean(),
	aiNutritionEnabled: z.boolean(),
})
