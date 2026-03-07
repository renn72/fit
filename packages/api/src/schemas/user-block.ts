import { z } from 'zod'

const NullableText = z.string().optional().nullable()
const NullableInt = z.number().int().optional().nullable()
const NullableNumber = z.number().optional().nullable()

export const UserBlockGetByUserInput = z.object({
	userId: z.string().min(1),
})

export const UserBlockGetTemplatesOrgInput = z.object({
	organisationId: z.string().min(1),
})

export const UserBlockGetInput = z.object({
	id: z.string().min(1),
})

export const UserBlockUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: NullableText,
	category: NullableText,
	tags: z.array(z.string()).optional(),
	restDayIndexes: z.array(z.number().int().min(0)).optional(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	isActive: z.boolean().optional(),
})

export const UserBlockDeleteInput = z.object({
	id: z.string().min(1),
})

const UserWarmupInput = z.object({
	warmupIndex: z.number().int().min(0),
	sourceWarmupId: z.string().optional().nullable(),
	name: z.string().min(1),
	description: NullableText,
	images: NullableText,
	link: NullableText,
})

const UserExerciseInput = z.object({
	exerciseIndex: z.number().int().min(0),
	sourceExerciseId: z.string().optional().nullable(),
	movementId: z.string().optional().nullable(),
	superSetGroup: z.string().optional().nullable(),
	superSetOrder: NullableInt,
	label: NullableText,
	sets: NullableInt,
	reps: NullableInt,
	repUnit: NullableText,
	ormPercent: NullableNumber,
	targetRpe: NullableNumber,
	restTime: NullableInt,
	restUnit: NullableText,
	tempoDown: NullableInt,
	tempoPause: NullableInt,
	tempoUp: NullableInt,
	notes: NullableText,
})

const UserWorkoutInput = z.object({
	dayIndex: z.number().int().min(0),
	workoutIndex: z.number().int().min(0),
	sourceWorkoutId: z.string().optional().nullable(),
	sourceWarmupGroupId: z.string().optional().nullable(),
	name: z.string().min(1),
	description: NullableText,
	category: NullableText,
	warmups: z.array(UserWarmupInput),
	exercises: z.array(UserExerciseInput),
})

export const UserBlockBatchCreateInput = z.object({
	userId: z.string().min(1),
	blockTemplateId: z.string().optional().nullable(),
	isTemplate: z.boolean().optional(),
	name: z.string().min(1),
	description: NullableText,
	category: NullableText,
	tags: z.array(z.string()).default([]),
	restDayIndexes: z.array(z.number().int().min(0)).default([]),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	workouts: z.array(UserWorkoutInput),
})

export const UserBlockBatchUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: NullableText,
	category: NullableText,
	tags: z.array(z.string()).default([]),
	restDayIndexes: z.array(z.number().int().min(0)).default([]),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	workouts: z.array(UserWorkoutInput),
})
