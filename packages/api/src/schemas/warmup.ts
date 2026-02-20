import { z } from 'zod'

// Warmup Group Schemas
export const WarmupGroupGetAllInput = z.object({
	organisationId: z.string().min(1),
})

export const WarmupGroupGetInput = z.object({
	id: z.string().min(1),
})

export const WarmupGroupCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
})

export const WarmupGroupUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
})

export const WarmupGroupDeleteInput = z.object({
	id: z.string().min(1),
})

// Warmup Schemas
export const WarmupGetAllInput = z.object({
	warmupGroupId: z.string().min(1),
})

export const WarmupGetInput = z.object({
	id: z.string().min(1),
})

export const WarmupCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	images: z.string().optional().nullable(),
	link: z.string().optional().nullable(),
	warmupGroupId: z.string().min(1),
})

export const WarmupUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	images: z.string().optional().nullable(),
	link: z.string().optional().nullable(),
})

export const WarmupDeleteInput = z.object({
	id: z.string().min(1),
})

export const WarmupItemInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	images: z.string().optional().nullable(),
	link: z.string().optional().nullable(),
})

export const WarmupGroupWithWarmupsCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	warmups: z.array(WarmupItemInput).min(1, 'At least one warmup is required'),
})
