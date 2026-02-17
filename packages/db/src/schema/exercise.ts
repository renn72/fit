import { user } from './auth'
import { organisation } from './org'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const baseExercise = s.sqliteTable('base_exercise', {
	id: s.text('id').primaryKey(), // Using the ID from JSON as primary key
	name: s.text('name').notNull(),
	force: s.text('force'),
	level: s.text('level'),
	mechanic: s.text('mechanic'),
	equipment: s.text('equipment'),
	primaryMuscles: s.text('primary_muscles'),
	secondaryMuscles: s.text('secondary_muscles'),
	instructions: s.text('instructions').notNull(),
	category: s.text('category').notNull(),
	images: s.text('images'),
	createdAt: s
		.integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: s
		.integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
})

export const exercise = s.sqliteTable(
	'exercise',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		name: s.text('name').notNull(),
		force: s.text('force'),
		level: s.text('level'),
		mechanic: s.text('mechanic'),
		equipment: s.text('equipment'),
		primaryMuscles: s.text('primary_muscles'),
		secondaryMuscles: s.text('secondary_muscles'),
		instructions: s.text('instructions'),
		category: s.text('category'),
		images: s.text('images'),
		baseExerciseId: s
			.text('base_exercise_id')
			.references(() => baseExercise.id, {
				onDelete: 'set null',
			}),
		creatorId: s.text('creator_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		organisationId: s
			.text('organisation_id')
			.references(() => organisation.id, { onDelete: 'cascade' })
			.notNull(),
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
	(table) => [s.index('exercise_organisationId_idx').on(table.organisationId)],
)
