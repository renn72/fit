import { z } from 'zod'

export const ExerciseGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
	limit: z.number().optional(),
})

export const ExerciseGetInput = z.object({
	id: z.string().min(1),
})

export const ExerciseGetAllBaseInput = z.object({
	limit: z.number().optional(),
})

export const ExerciseGetAllInput = z.object({
	limit: z.number().optional(),
})

export const ExerciseCreateInput = z.object({
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
	baseExerciseId: z.string().optional().nullable(),
})

export const ExerciseUpdateInput = z.object({
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
