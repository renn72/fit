import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

export const organisation = sqliteTable('organisation', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }),
	createdBy: text('created_by')
		.notNull()
		.references(() => user.id),
})
