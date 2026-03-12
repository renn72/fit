import { user } from './auth'
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
