import { user } from './auth'
import { ingredient } from './ingredient'
import { organisation } from './org'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const recipe = s.sqliteTable(
	'recipe',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		name: s.text('name').notNull(),
		description: s.text('description').notNull(),
		category: s.text('category'),
		image: s.text('image'),
		metaTags: s.text('meta_tags').notNull(), // Comma separated tags
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
		s.index('recipe_organisationId_idx').on(table.organisationId),
		s.index('recipe_creatorId_idx').on(table.creatorId),
	],
)

export const recipeToIngredient = s.sqliteTable('recipe_to_ingredient', {
	id: s
		.text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	recipeId: s
		.text('recipe_id')
		.references(() => recipe.id, { onDelete: 'cascade' })
		.notNull(),
	ingredientId: s
		.text('ingredient_id')
		.references(() => ingredient.id, { onDelete: 'cascade' })
		.notNull(),
	altIngredientId: s.text('alt_ingredient_id').references(() => ingredient.id, {
		onDelete: 'set null',
	}),
	amount: s.real('amount').notNull(),
	unit: s.text('unit').notNull(),
})
