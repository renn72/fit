import { z } from 'zod'

export const SubscriptionUpdateInput = z.object({
	id: z.string().min(1),
	discountType: z.enum(['percentage', 'fixed']).optional().nullable(),
	discountValue: z.number().int().min(0).optional().nullable(),
	discountReason: z.string().optional().nullable(),
	discountExpiresAt: z.number().optional().nullable(), // timestamp
	bonusMembers: z.number().int().min(0).optional(),
	bonusTrainers: z.number().int().min(0).optional(),
	bonusReason: z.string().optional().nullable(),
	bonusExpiresAt: z.number().optional().nullable(), // timestamp
})

export const SubscriptionGetByOrgInput = z.object({
	organisationId: z.string().min(1),
})

export const SubscriptionGetInput = z.object({
	id: z.string().min(1),
})
