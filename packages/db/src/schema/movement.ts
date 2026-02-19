import { user } from './auth'
import { organisation } from './org'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const movement = s.sqliteTable(
	'movement',
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
		isBase: s.integer('is_base', { mode: 'boolean' }).notNull().default(false),
		baseId: s.text('base_id').references((): any => movement.id, {
			onDelete: 'set null',
		}),
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
		s.index('movement_organisationId_idx').on(table.organisationId),
		s.index('movement_isBase_idx').on(table.isBase),
	],
)
