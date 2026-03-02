import { z } from 'zod'

export const ExerciseGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
	limit: z.number().optional(),
})

export const ExerciseGetInput = z.object({
	id: z.string().min(1),
})

export const ExerciseCreateInput = z.object({
	name: z.string().min(1),
	movementId: z.string().optional().nullable(),
	sets: z.number().int().optional().nullable(),
	reps: z.number().int().optional().nullable(),
	repUnit: z.string().optional().nullable(),
	ormPercent: z.number().optional().nullable(),
	targetRpe: z.number().optional().nullable(),
	restTime: z.number().int().optional().nullable(),
	restUnit: z.string().optional().nullable(),
	tempoDown: z.number().int().optional().nullable(),
	tempoPause: z.number().int().optional().nullable(),
	tempoUp: z.number().int().optional().nullable(),
	notes: z.string().optional().nullable(),
	isSuperSet: z.boolean().optional(),
})

export const ExerciseUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	movementId: z.string().optional().nullable(),
	sets: z.number().int().optional().nullable(),
	reps: z.number().int().optional().nullable(),
	repUnit: z.string().optional().nullable(),
	ormPercent: z.number().optional().nullable(),
	targetRpe: z.number().optional().nullable(),
	restTime: z.number().int().optional().nullable(),
	restUnit: z.string().optional().nullable(),
	tempoDown: z.number().int().optional().nullable(),
	tempoPause: z.number().int().optional().nullable(),
	tempoUp: z.number().int().optional().nullable(),
	notes: z.string().optional().nullable(),
	isSuperSet: z.boolean().optional(),
})

export const ExerciseDeleteInput = z.object({
	id: z.string().min(1),
})

export const SuperSetAddExerciseInput = z.object({
	superSetId: z.string().min(1),
	exerciseId: z.string().min(1),
	order: z.number().int().optional(),
})

export const SuperSetRemoveExerciseInput = z.object({
	superSetId: z.string().min(1),
	exerciseId: z.string().min(1),
})

export const SuperSetGetExercisesInput = z.object({
	superSetId: z.string().min(1),
})

const SuperSetMemberCreateExerciseInput = z.object({
	name: z.string().min(1),
	movementId: z.string().optional().nullable(),
	sets: z.number().int().optional().nullable(),
	reps: z.number().int().optional().nullable(),
	repUnit: z.string().optional().nullable(),
	ormPercent: z.number().optional().nullable(),
	tempoDown: z.number().int().optional().nullable(),
	tempoPause: z.number().int().optional().nullable(),
	tempoUp: z.number().int().optional().nullable(),
	notes: z.string().optional().nullable(),
})

const SuperSetMemberInput = z
	.object({
		order: z.number().int().optional(),
		exerciseId: z.string().min(1).optional(),
		newExercise: SuperSetMemberCreateExerciseInput.optional(),
	})
	.refine(
		(value) => Number(!!value.exerciseId) + Number(!!value.newExercise) === 1,
		{
			message:
				'Each superset member must either reference an existing exercise or define a new one',
		},
	)

export const SuperSetCreateInput = z.object({
	name: z.string().min(1),
	targetRpe: z.number().optional().nullable(),
	restTime: z.number().int().optional().nullable(),
	restUnit: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	members: z.array(SuperSetMemberInput).min(1),
})

export const SuperSetUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	targetRpe: z.number().optional().nullable(),
	restTime: z.number().int().optional().nullable(),
	restUnit: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	members: z.array(SuperSetMemberInput).min(1),
})
