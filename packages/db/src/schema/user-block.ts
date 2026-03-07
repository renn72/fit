import { user } from './auth'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const userBlock = s.sqliteTable(
	'user_block',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userId: s
			.text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: s.text('name').notNull(),
		description: s.text('description'),
		category: s.text('category'),
		tags: s.text('tags').notNull().default(''),
		restDayIndexes: s.text('rest_day_indexes').notNull().default('[]'),
		startDate: s.integer('start_date', { mode: 'timestamp' }),
		endDate: s.integer('end_date', { mode: 'timestamp' }),
		isActive: s
			.integer('is_active', { mode: 'boolean' })
			.notNull()
			.default(true),
		isTemplate: s
			.integer('is_template', { mode: 'boolean' })
			.notNull()
			.default(false),
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
		s.index('user_block_userId_idx').on(table.userId),
		s.index('user_block_isActive_idx').on(table.isActive),
		s.index('user_block_isTemplate_idx').on(table.isTemplate),
		s.index('user_block_startDate_idx').on(table.startDate),
	],
)

export const userWorkout = s.sqliteTable(
	'user_workout',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userBlockId: s
			.text('user_block_id')
			.notNull()
			.references(() => userBlock.id, { onDelete: 'cascade' }),
		sourceWorkoutId: s.text('source_workout_id'),
		sourceWarmupGroupId: s.text('source_warmup_group_id'),
		dayIndex: s.integer('day_index').notNull(),
		workoutIndex: s.integer('workout_index').notNull(),
		name: s.text('name').notNull(),
		description: s.text('description'),
		category: s.text('category'),
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
		s.index('user_workout_userBlockId_idx').on(table.userBlockId),
		s.index('user_workout_sourceWorkoutId_idx').on(table.sourceWorkoutId),
		s.index('user_workout_dayIndex_idx').on(table.dayIndex),
		s
			.uniqueIndex('user_workout_schedule_unique_idx')
			.on(table.userBlockId, table.dayIndex, table.workoutIndex),
	],
)

export const userWarmup = s.sqliteTable(
	'user_warmup',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userWorkoutId: s
			.text('user_workout_id')
			.notNull()
			.references(() => userWorkout.id, { onDelete: 'cascade' }),
		sourceWarmupId: s.text('source_warmup_id'),
		warmupIndex: s.integer('warmup_index').notNull(),
		name: s.text('name').notNull(),
		description: s.text('description'),
		images: s.text('images'),
		link: s.text('link'),
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
		s.index('user_warmup_userWorkoutId_idx').on(table.userWorkoutId),
		s.index('user_warmup_sourceWarmupId_idx').on(table.sourceWarmupId),
		s
			.uniqueIndex('user_warmup_order_unique_idx')
			.on(table.userWorkoutId, table.warmupIndex),
	],
)

export const userExercise = s.sqliteTable(
	'user_exercise',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userWorkoutId: s
			.text('user_workout_id')
			.notNull()
			.references(() => userWorkout.id, { onDelete: 'cascade' }),
		sourceExerciseId: s.text('source_exercise_id'),
		movementId: s.text('movement_id'),
		exerciseIndex: s.integer('exercise_index').notNull(),
		superSetGroup: s.text('super_set_group'),
		superSetOrder: s.integer('super_set_order'),
		label: s.text('label'),
		sets: s.integer('sets'),
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
		s.index('user_exercise_userWorkoutId_idx').on(table.userWorkoutId),
		s.index('user_exercise_sourceExerciseId_idx').on(table.sourceExerciseId),
		s.index('user_exercise_movementId_idx').on(table.movementId),
		s.index('user_exercise_superSetGroup_idx').on(table.superSetGroup),
		s
			.uniqueIndex('user_exercise_order_unique_idx')
			.on(table.userWorkoutId, table.exerciseIndex),
	],
)
