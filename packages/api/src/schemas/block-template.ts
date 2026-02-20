import { z } from 'zod'

export const BlockTemplateGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
})

export const BlockTemplateGetInput = z.object({
	id: z.string().min(1),
})

export const BlockTemplateCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	restDayIndex: z.number().int().optional().nullable(),
})

export const BlockTemplateUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	restDayIndex: z.number().int().optional().nullable(),
})

export const BlockTemplateDeleteInput = z.object({
	id: z.string().min(1),
})

export const BlockTemplateAddWorkoutInput = z.object({
	blockTemplateId: z.string().min(1),
	workoutId: z.string().min(1),
	index: z.number().int(),
})

export const BlockTemplateRemoveWorkoutInput = z.object({
	blockTemplateId: z.string().min(1),
	workoutId: z.string().min(1),
})
