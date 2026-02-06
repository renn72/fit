import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'
import { user } from './auth'

export const organisation = sqliteTable('organisation', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	state: text('state').notNull(),
	creatorId: text('creator_id').references(() => user.id, {
		onDelete: 'set null',
	}),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
})

export const subscription = sqliteTable('subscription', {
	id: text('id').primaryKey(),
	organisationId: text('organisation_id')
		.references(() => organisation.id)
		.notNull(),
	stripeId: text('stripe_id').unique(),
	planId: text('plan_id').notNull(),
	status: text('status').notNull(),
	currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
})

export const plan = sqliteTable('plan', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	price: integer('price').notNull(),
	interval: text('interval').notNull(),
	stripePriceId: text('stripe_price_id').unique(),
})

export const planLimit = sqliteTable('plan_limit', {
	id: text('id').primaryKey(),
	planId: text('plan_id').references(() => plan.id),
	maxMembers: integer('max_members').default(5),
	hasAdvancedAnalytics: integer('has_advanced_analytics', {
		mode: 'boolean',
	}).default(false),
})
