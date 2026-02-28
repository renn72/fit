import { user } from './auth'
import { organisation } from './org'
import { recipe } from './recipe'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

// Deprecated: new template storage uses `user_menu.is_template`.
// Keep this schema for backward compatibility until legacy data is removed.
export const menuTemplate = s.sqliteTable(
	'menu_template',
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
		s.index('menu_template_creatorId_idx').on(table.creatorId),
		s.index('menu_template_organisationId_idx').on(table.organisationId),
	],
)

export const menuTemplateMeal = s.sqliteTable(
	'menu_template_meal',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		menuTemplateId: s
			.text('menu_template_id')
			.notNull()
			.references(() => menuTemplate.id, { onDelete: 'cascade' }),
		mealIndex: s.integer('meal_index').notNull(),
		name: s.text('name').notNull(),
	},
	(table) => [
		s.index('menu_template_meal_menuTemplateId_idx').on(table.menuTemplateId),
	],
)

export const menuTemplateToRecipe = s.sqliteTable(
	'menu_template_to_recipe',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		menuTemplateId: s
			.text('menu_template_id')
			.notNull()
			.references(() => menuTemplate.id, { onDelete: 'cascade' }),
		recipeId: s
			.text('recipe_id')
			.notNull()
			.references(() => recipe.id, { onDelete: 'cascade' }),
		mealIndex: s.integer('meal_index').notNull(),
		recipeIndex: s.integer('recipe_index').notNull(),
		createdAt: s
			.integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		s.index('menu_template_recipe_menuTemplateId_idx').on(table.menuTemplateId),
		s.index('menu_template_recipe_recipeId_idx').on(table.recipeId),
		s.index('menu_template_recipe_mealIndex_idx').on(table.mealIndex),
		s.index('menu_template_recipe_recipeIndex_idx').on(table.recipeIndex),
		s
			.uniqueIndex('menu_template_recipe_unique_idx')
			.on(
				table.menuTemplateId,
				table.recipeId,
				table.mealIndex,
				table.recipeIndex,
			),
	],
)
