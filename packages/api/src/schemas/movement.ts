import { z } from 'zod'

export const MovementGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
	limit: z.number().optional(),
})

export const MovementGetInput = z.object({
	id: z.string().min(1),
})

export const MovementGetAllBaseInput = z.object({
	limit: z.number().optional(),
})

export const MovementGetAllInput = z.object({
	limit: z.number().optional(),
})

export const MovementCreateInput = z.object({
	name: z.string().min(1),
	force: z.string().optional().nullable(),
	level: z.string().optional().nullable(),
	mechanic: z.string().optional().nullable(),
	equipment: z.string().optional().nullable(),
	primaryMuscles: z.string().optional().nullable(),
	secondaryMuscles: z.string().optional().nullable(),
	instructions: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	images: z.string().optional().nullable(),
	baseId: z.string().optional().nullable(),
})

export const MovementUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	force: z.string().optional().nullable(),
	level: z.string().optional().nullable(),
	mechanic: z.string().optional().nullable(),
	equipment: z.string().optional().nullable(),
	primaryMuscles: z.string().optional().nullable(),
	secondaryMuscles: z.string().optional().nullable(),
	instructions: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	images: z.string().optional().nullable(),
})

export const MovementDeleteInput = z.object({
	id: z.string().min(1),
})
