import { user } from './auth'
import { organisation } from './org'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const ingredient = s.sqliteTable(
	'ingredient',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		publicFoodKey: s.text('public_food_key'),
		name: s.text('name').notNull(),
		category: s.text('category'), // comma delimited list
		calories: s.real('calories').notNull(),
		protein: s.real('protein').notNull(),
		fat: s.real('fat').notNull(),
		carbohydrate: s.real('carbohydrate').notNull(),
		serveSize: s.real('serve_size').notNull(),
		serveUnit: s.text('serve_unit').notNull(),
		precision: s.real('precision').notNull().default(0.1),
		isBase: s.integer('is_base', { mode: 'boolean' }).notNull().default(false),
		isUserCreated: s
			.integer('is_user_created', { mode: 'boolean' })
			.notNull()
			.default(false),
		baseId: s.text('base_id').references((): any => ingredient.id, {
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
		s.index('ingredient_organisationId_idx').on(table.organisationId),
		s.index('ingredient_isBase_idx').on(table.isBase),
		s.index('ingredient_isUserCreated_idx').on(table.isUserCreated),
	],
)
