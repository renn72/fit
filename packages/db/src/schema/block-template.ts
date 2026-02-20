import { user } from './auth'
import { organisation } from './org'
import { workout } from './workout'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const blockTemplate = s.sqliteTable(
	'block_template',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		name: s.text('name').notNull(),
		description: s.text('description'),
		category: s.text('category'),
		restDayIndex: s.integer('rest_day_index'),
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
		s.index('block_template_creatorId_idx').on(table.creatorId),
		s.index('block_template_organisationId_idx').on(table.organisationId),
	],
)

export const blockTemplateToWorkout = s.sqliteTable(
	'block_template_to_workout',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		blockTemplateId: s
			.text('block_template_id')
			.notNull()
			.references(() => blockTemplate.id, { onDelete: 'cascade' }),
		workoutId: s
			.text('workout_id')
			.notNull()
			.references(() => workout.id, { onDelete: 'cascade' }),
		index: s.integer('index').notNull(),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		s
			.index('block_template_workout_blockTemplateId_idx')
			.on(table.blockTemplateId),
		s.index('block_template_workout_workoutId_idx').on(table.workoutId),
		s
			.uniqueIndex('block_template_workout_unique_idx')
			.on(table.blockTemplateId, table.workoutId),
	],
)
