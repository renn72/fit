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
