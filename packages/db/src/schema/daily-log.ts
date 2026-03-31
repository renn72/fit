import { user } from './auth'
import { movement } from './movement'
import { organisation } from './org'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const dailyLog = s.sqliteTable(
	'daily_log',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userId: s
			.text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		organisationId: s
			.text('organisation_id')
			.notNull()
			.references(() => organisation.id, { onDelete: 'cascade' }),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: s
			.integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		s.index('daily_log_userId_idx').on(table.userId),
		s.index('daily_log_organisationId_idx').on(table.organisationId),
		s.index('daily_log_createdAt_idx').on(table.createdAt),
	],
)

export const dailyLogWeight = s.sqliteTable(
	'daily_log_weight',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		dailyLogId: s
			.text('daily_log_id')
			.notNull()
			.references(() => dailyLog.id, { onDelete: 'cascade' }),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		unit: s.text('unit').notNull(),
		value: s.real('value').notNull(),
	},
	(table) => [
		s.index('daily_log_weight_dailyLogId_idx').on(table.dailyLogId),
		s.index('daily_log_weight_createdAt_idx').on(table.createdAt),
	],
)

export const dailyLogStat = s.sqliteTable(
	'daily_log_stat',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		dailyLogId: s
			.text('daily_log_id')
			.notNull()
			.references(() => dailyLog.id, { onDelete: 'cascade' }),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		unit: s.text('unit').notNull(),
		value: s.real('value').notNull(),
		title: s.text('title').notNull(),
	},
	(table) => [
		s.index('daily_log_stat_dailyLogId_idx').on(table.dailyLogId),
		s.index('daily_log_stat_createdAt_idx').on(table.createdAt),
		s.index('daily_log_stat_title_idx').on(table.title),
	],
)

export const dailyLogMeal = s.sqliteTable(
	'daily_log_meal',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		dailyLogId: s
			.text('daily_log_id')
			.notNull()
			.references(() => dailyLog.id, { onDelete: 'cascade' }),
		mealIndex: s.integer('meal_index').notNull(),
		name: s.text('name').notNull(),
		recipeId: s.text('recipe_id').notNull(),
		calories: s.real('total_calories').notNull().default(0),
		protein: s.real('total_protein').notNull().default(0),
		fat: s.real('total_fat').notNull().default(0),
		carbohydrate: s.real('total_carbohydrate').notNull().default(0),
	},
	(table) => [
		s.index('daily_log_meal_dailyLogId_idx').on(table.dailyLogId),
		s.index('daily_log_meal_mealIndex_idx').on(table.mealIndex),
		s.index('daily_log_meal_recipeId_idx').on(table.recipeId),
	],
)

export const dailyLogWorkout = s.sqliteTable(
	'daily_log_workout',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		dailyLogId: s
			.text('daily_log_id')
			.notNull()
			.references(() => dailyLog.id, { onDelete: 'cascade' }),
		workoutIndex: s.integer('workout_index').notNull(),
		userWorkoutId: s.text('user_workout_id').notNull(),
		name: s.text('name').notNull(),
		energyLevel: s.text('energy_level').notNull(),
	},
	(table) => [
		s.index('daily_log_workout_dailyLogId_idx').on(table.dailyLogId),
		s.index('daily_log_workout_workoutIndex_idx').on(table.workoutIndex),
		s.index('daily_log_workout_userWorkoutId_idx').on(table.userWorkoutId),
	],
)

export const dailyLogWarmup = s.sqliteTable(
	'daily_log_warmup',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		dailyLogWorkoutId: s
			.text('daily_log_workout_id')
			.notNull()
			.references(() => dailyLogWorkout.id, { onDelete: 'cascade' }),
		warmupIndex: s.integer('warmup_index').notNull(),
		name: s.text('name').notNull(),
		sourceWarmupId: s.text('source_warmup_id'),
	},
	(table) => [
		s.index('daily_log_warmup_dailyLogWorkoutId_idx').on(table.dailyLogWorkoutId),
		s.index('daily_log_warmup_warmupIndex_idx').on(table.warmupIndex),
		s.index('daily_log_warmup_sourceWarmupId_idx').on(table.sourceWarmupId),
	],
)

export const dailyLogExercise = s.sqliteTable(
	'daily_log_exercise',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		dailyLogWorkoutId: s
			.text('daily_log_workout_id')
			.notNull()
			.references(() => dailyLogWorkout.id, { onDelete: 'cascade' }),
		sourceExerciseId: s.text('source_exercise_id'),
		movementId: s.text('movement_id').references(() => movement.id, {
			onDelete: 'set null',
		}),
		exerciseIndex: s.integer('exercise_index').notNull(),
		superSetGroup: s.text('super_set_group'),
		superSetOrder: s.integer('super_set_order'),
		label: s.text('label'),
		targetSets: s.integer('sets'),
		reps: s.integer('reps'),
		repUnit: s.text('rep_unit'),
		ormPercent: s.real('orm_percent'),
		targetRpe: s.real('target_rpe'),
		restTime: s.integer('rest_time'),
		restUnit: s.text('rest_unit'),
		tempoDown: s.integer('tempo_down'),
		tempoPause: s.integer('tempo_pause'),
		tempoUp: s.integer('tempo_up'),
		notes: s.text('notes'),
	},
	(table) => [
		s.index('daily_log_exercise_dailyLogWorkoutId_idx').on(table.dailyLogWorkoutId),
		s.index('daily_log_exercise_exerciseIndex_idx').on(table.exerciseIndex),
		s.index('daily_log_exercise_sourceExerciseId_idx').on(table.sourceExerciseId),
		s.index('daily_log_exercise_movementId_idx').on(table.movementId),
	],
)

export const dailyLogSet = s.sqliteTable(
	'daily_log_set',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		dailyLogExerciseId: s
			.text('daily_log_exercise_id')
			.notNull()
			.references(() => dailyLogExercise.id, { onDelete: 'cascade' }),
		setIndex: s.integer('set_index').notNull(),
		reps: s.integer('reps'),
		weight: s.real('weight'),
		rpe: s.real('rpe'),
		notes: s.text('notes'),
	},
	(table) => [
		s.index('daily_log_set_dailyLogExerciseId_idx').on(table.dailyLogExerciseId),
		s.index('daily_log_set_setIndex_idx').on(table.setIndex),
	],
)
