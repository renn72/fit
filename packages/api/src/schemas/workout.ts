import { z } from 'zod'

export const WorkoutGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
})

export const WorkoutGetInput = z.object({
	id: z.string().min(1),
})

export const WorkoutCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	warmupGroupId: z.string().optional().nullable(),
})

export const WorkoutUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
	warmupGroupId: z.string().optional().nullable(),
})

export const WorkoutDeleteInput = z.object({
	id: z.string().min(1),
})

export const WorkoutAddExerciseInput = z.object({
	workoutId: z.string().min(1),
	exerciseId: z.string().min(1),
	index: z.number().int(),
})

export const WorkoutRemoveExerciseInput = z.object({
	workoutId: z.string().min(1),
	exerciseId: z.string().min(1),
})

export const WorkoutAddSuperSetInput = z.object({
	workoutId: z.string().min(1),
	superSetId: z.string().min(1),
	index: z.number().int(),
})

export const WorkoutRemoveSuperSetInput = z.object({
	workoutId: z.string().min(1),
	superSetId: z.string().min(1),
})
