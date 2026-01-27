import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const log = sqliteTable('user', {
	id: int('id').primaryKey({ autoIncrement: true }),
	message: text('name'),
	level: text('action'),
	timestamp: text('info'),
	context: text('code'),
	notes: text('notes'),
	createdAt: int('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
})
