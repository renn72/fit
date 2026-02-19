import { user } from './auth'
import { exercise } from './exercise'
import { organisation } from './org'
import { warmupGroup } from './warmup'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const session = s.sqliteTable(
	'session',
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
		s.index('session_creatorId_idx').on(table.creatorId),
		s.index('session_organisationId_idx').on(table.organisationId),
		s.index('session_warmupGroupId_idx').on(table.warmupGroupId),
	],
)

export const sessionToExercise = s.sqliteTable(
	'session_to_exercise',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		sessionId: s
			.text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
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
		s.index('session_exercise_sessionId_idx').on(table.sessionId),
		s.index('session_exercise_exerciseId_idx').on(table.exerciseId),
		s
			.uniqueIndex('session_exercise_unique_idx')
			.on(table.sessionId, table.exerciseId),
	],
)

export const sessionToSuperSet = s.sqliteTable(
	'session_to_superset',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		sessionId: s
			.text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
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
		s.index('session_superset_sessionId_idx').on(table.sessionId),
		s.index('session_superset_supersetId_idx').on(table.superSetId),
		s
			.uniqueIndex('session_superset_unique_idx')
			.on(table.sessionId, table.superSetId),
	],
)
