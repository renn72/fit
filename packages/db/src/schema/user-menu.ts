import { user } from './auth'
import { ingredient } from './ingredient'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

// ***************** User Menu (Menu Assignment to User) *******************
export const userMenu = s.sqliteTable(
	'user_menu',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userId: s
			.text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: s.text('name').notNull(),
		description: s.text('description'),
		startDate: s.integer('start_date', { mode: 'timestamp' }),
		endDate: s.integer('end_date', { mode: 'timestamp' }),
		isActive: s
			.integer('is_active', { mode: 'boolean' })
			.notNull()
			.default(true),
		isTemplate: s
			.integer('is_template', { mode: 'boolean' })
			.notNull()
			.default(false),
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
		s.index('user_menu_userId_idx').on(table.userId),
		s.index('user_menu_isActive_idx').on(table.isActive),
		s.index('user_menu_isTemplate_idx').on(table.isTemplate),
		s.index('user_menu_startDate_idx').on(table.startDate),
	],
)

// ***************** User Meal (Meal Level Aggregation) *******************
export const userMeal = s.sqliteTable(
	'user_meal',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userMenuId: s
			.text('user_menu_id')
			.notNull()
			.references(() => userMenu.id, { onDelete: 'cascade' }),
		mealIndex: s.integer('meal_index').notNull(),
		name: s.text('name'),
		calories: s.real('total_calories').notNull().default(0),
		protein: s.real('total_protein').notNull().default(0),
		fat: s.real('total_fat').notNull().default(0),
		carbohydrate: s.real('total_carbohydrate').notNull().default(0),
	},
	(table) => [s.index('user_meal_userMenuId_idx').on(table.userMenuId)],
)

// ***************** User Recipe (Standalone Recipe Copy) *******************
export const userRecipe = s.sqliteTable(
	'user_recipe',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userMenuId: s
			.text('user_menu_id')
			.notNull()
			.references(() => userMenu.id, { onDelete: 'cascade' }),
		mealIndex: s.integer('meal_index').notNull(),
		recipeIndex: s.integer('recipe_index').notNull(),
		name: s.text('name').notNull(),
		description: s.text('description'),
		category: s.text('category'),
		image: s.text('image'),
	},
	(table) => [s.index('user_recipe_userMenuId_idx').on(table.userMenuId)],
)

// ***************** User Ingredient (Ingredient Assignment) *******************
export const userIngredient = s.sqliteTable(
	'user_ingredient',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		userMenuId: s
			.text('user_menu_id')
			.notNull()
			.references(() => userMenu.id, { onDelete: 'cascade' }),
		ingredientId: s
			.text('ingredient_id')
			.notNull()
			.references(() => ingredient.id, { onDelete: 'cascade' }),
		altIngredientId: s
			.text('alt_ingredient_id')
			.references(() => ingredient.id, { onDelete: 'set null' }),
		mealIndex: s.integer('meal_index').notNull(),
		recipeIndex: s.integer('recipe_index').notNull(),
		serveSize: s.real('serve_size').notNull(),
		serveUnit: s.text('serve_unit').notNull(),
		altServeSize: s.real('alt_serve_size'),
		altServeUnit: s.text('alt_serve_unit'),
	},
	(table) => [s.index('user_ingredient_userMenuId_idx').on(table.userMenuId)],
)
