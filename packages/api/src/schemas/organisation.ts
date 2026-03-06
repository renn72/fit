import { z } from 'zod'

export const OrganisationCreateInput = z.object({
	name: z.string().min(1).max(32),
	slug: z.string().min(1).max(32),
	timezone: z.string().min(1),
	planId: z.string().min(1),
	code: z.string().optional().nullable(),
})

export const OrganisationGetPlanByCodeInput = z.object({
	code: z.string().min(1),
})

export const PlanCreateInput = z.object({
	name: z.string().min(1).max(32),
	description: z.string().min(1),
	features: z.string().optional().default(''),
	cta: z.string().min(1),
	priceMonthly: z.number().int().min(0),
	priceYearly: z.number().int().min(0),
	maxMembers: z.number().int().min(1),
	maxTrainers: z.number().int().min(1),
	tags: z.string().optional().default(''),
	metaTags: z.string().optional().default(''),
	hidden: z.boolean().default(false),
})

export const PlanUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).max(32).optional(),
	description: z.string().min(1).optional(),
	features: z.string().optional(),
	cta: z.string().min(1).optional(),
	priceMonthly: z.number().int().min(0).optional(),
	priceYearly: z.number().int().min(0).optional(),
	maxMembers: z.number().int().min(1).optional(),
	maxTrainers: z.number().int().min(1).optional(),
	tags: z.string().optional(),
	metaTags: z.string().optional(),
	hidden: z.boolean().optional(),
})

export const PlanDeleteInput = z.object({
	id: z.string().min(1),
})

export const OrganisationUpdateMetaTagsInput = z.object({
	organisationId: z.string().min(1),
	metaTags: z.string().default(''),
})
