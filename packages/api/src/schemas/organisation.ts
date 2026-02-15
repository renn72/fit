import { z } from 'zod'

export const OrganisationCreateInput = z.object({
	name: z.string().min(1).max(32),
	slug: z.string().min(1).max(32),
	timezone: z.string().min(1),
	planId: z.string().min(1),
	code: z.string().optional(),
})

export const OrganisationGetPlanByCodeInput = z.object({
	code: z.string().min(1),
})
