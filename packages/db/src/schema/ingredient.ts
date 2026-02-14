import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const baseIngredients = s.sqliteTable('base_ingredients', {
	id: s
		.text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	publicFoodKey: s.text('public_food_key').notNull(),
	name: s.text('name').notNull(),
	calories: s.real('calories').notNull(),
	protein: s.real('protein').notNull(),
	fat: s.real('fat').notNull(),
	carbohydrate: s.real('carbohydrate').notNull(),
	serveSize: s.real('serve_size').notNull(),
	serveUnit: s.text('serve_unit').notNull(),
	createdAt: s
		.integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
})
