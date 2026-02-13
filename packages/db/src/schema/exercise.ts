import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'

export const baseExercise = s.sqliteTable('base_exercise', {
	id: s.text('id').primaryKey(), // Using the ID from JSON as primary key
	name: s.text('name').notNull(),
	force: s.text('force'),
	level: s.text('level').notNull(),
	mechanic: s.text('mechanic'),
	equipment: s.text('equipment'),
	primaryMuscles: s
		.text('primary_muscles', { mode: 'json' })
		.$type<string[]>()
		.notNull(),
	secondaryMuscles: s
		.text('secondary_muscles', { mode: 'json' })
		.$type<string[]>()
		.notNull(),
	instructions: s
		.text('instructions', { mode: 'json' })
		.$type<string[]>()
		.notNull(),
	category: s.text('category').notNull(),
	images: s.text('images', { mode: 'json' }).$type<string[]>().notNull(),
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
