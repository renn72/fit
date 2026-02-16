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
	level: z.string().min(1),
	mechanic: z.string().optional().nullable(),
	equipment: z.string().optional().nullable(),
	primaryMuscles: z.string().min(1),
	secondaryMuscles: z.string(),
	instructions: z.string().min(1),
	category: z.string().min(1),
	images: z.string(),
	baseExerciseId: z.string().optional().nullable(),
})
