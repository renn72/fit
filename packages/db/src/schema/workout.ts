import { user } from './auth'
import { exercise } from './exercise'
import { organisation } from './org'
import { warmupGroup } from './warmup'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const workout = s.sqliteTable(
	'workout',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		name: s.text('name').notNull(),
		description: s.text('description'),
		category: s.text('category'),
		creatorId: s.text('creator_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		organisationId: s
			.text('organisation_id')
			.references(() => organisation.id, { onDelete: 'cascade' }),
		warmupGroupId: s
			.text('warmup_group_id')
			.references(() => warmupGroup.id, { onDelete: 'set null' }),
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
		s.index('workout_creatorId_idx').on(table.creatorId),
		s.index('workout_organisationId_idx').on(table.organisationId),
		s.index('workout_warmupGroupId_idx').on(table.warmupGroupId),
	],
)

export const workoutToExercise = s.sqliteTable(
	'workout_to_exercise',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		workoutId: s
			.text('workout_id')
			.notNull()
			.references(() => workout.id, { onDelete: 'cascade' }),
		exerciseId: s
			.text('exercise_id')
			.notNull()
			.references(() => exercise.id, { onDelete: 'cascade' }),
		index: s.integer('index').notNull(),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		s.index('workout_exercise_workoutId_idx').on(table.workoutId),
		s.index('workout_exercise_exerciseId_idx').on(table.exerciseId),
		s
			.uniqueIndex('workout_exercise_unique_idx')
			.on(table.workoutId, table.exerciseId),
	],
)

export const workoutToSuperSet = s.sqliteTable(
	'workout_to_superset',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		workoutId: s
			.text('workout_id')
			.notNull()
			.references(() => workout.id, { onDelete: 'cascade' }),
		superSetId: s
			.text('superset_id')
			.notNull()
			.references(() => exercise.id, { onDelete: 'cascade' }),
		index: s.integer('index').notNull(),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		s.index('workout_superset_workoutId_idx').on(table.workoutId),
		s.index('workout_superset_supersetId_idx').on(table.superSetId),
		s
			.uniqueIndex('workout_superset_unique_idx')
			.on(table.workoutId, table.superSetId),
	],
)
