import { user } from './auth'
import { movement } from './movement'
import { organisation } from './org'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const exercise = s.sqliteTable(
	'exercise',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		name: s.text('name').notNull(),
		movementId: s.text('movement_id').references(() => movement.id, {
			onDelete: 'set null',
		}),
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
		isSuperSet: s
			.integer('is_superset', { mode: 'boolean' })
			.default(false)
			.notNull(),
		creatorId: s.text('creator_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		organisationId: s
			.text('organisation_id')
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
		s.index('exercise_movementId_idx').on(table.movementId),
		s.index('exercise_organisationId_idx').on(table.organisationId),
		s.index('exercise_isSuperSet_idx').on(table.isSuperSet),
	],
)

export const superSetToExercise = s.sqliteTable(
	'super_set_to_exercise',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		superSetId: s
			.text('super_set_id')
			.notNull()
			.references(() => exercise.id, { onDelete: 'cascade' }),
		exerciseId: s
			.text('exercise_id')
			.notNull()
			.references(() => exercise.id, { onDelete: 'cascade' }),
		order: s.integer('order').default(0).notNull(),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		s.index('superset_superSetId_idx').on(table.superSetId),
		s.index('superset_exerciseId_idx').on(table.exerciseId),
		s.uniqueIndex('superset_unique_idx').on(table.superSetId, table.exerciseId),
	],
)
