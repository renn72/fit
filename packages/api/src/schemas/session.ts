import { z } from 'zod'

export const SessionGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
})

export const SessionGetInput = z.object({
	id: z.string().min(1),
})

export const SessionCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
})

export const SessionUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
})

export const SessionDeleteInput = z.object({
	id: z.string().min(1),
})

export const SessionAddExerciseInput = z.object({
	sessionId: z.string().min(1),
	exerciseId: z.string().min(1),
	index: z.number().int().notNull(),
})

export const SessionRemoveExerciseInput = z.object({
	sessionId: z.string().min(1),
	exerciseId: z.string().min(1),
})

export const SessionAddSuperSetInput = z.object({
	sessionId: z.string().min(1),
	superSetId: z.string().min(1),
	index: z.number().int().notNull(),
})

export const SessionRemoveSuperSetInput = z.object({
	sessionId: z.string().min(1),
	superSetId: z.string().min(1),
})
