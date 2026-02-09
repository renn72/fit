import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'
import { user } from './auth'

export const organisation = s.sqliteTable('organisation', {
	id: s
		.text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	name: s.text('name').notNull(),
	slug: s.text('slug').notNull().unique(),
	state: s.text('state').notNull(),
	creatorId: s.text('creator_id').references(() => user.id, {
		onDelete: 'set null',
	}),
	createdAt: s
		.integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: s
		.integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
})

export const subscription = s.sqliteTable('subscription', {
	id: s
		.text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	organisationId: s
		.text('organisation_id')
		.references(() => organisation.id, { onDelete: 'cascade' })
		.notNull(),
	stripeId: s.text('stripe_id'),
	planId: s.text('plan_id').notNull(),
	status: s.text('status').notNull(),
	currentPeriodEnd: s.integer('current_period_end', { mode: 'timestamp' }),
})

export const plan = s.sqliteTable('plan', {
	id: s
		.text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	name: s.text('name').notNull(),
	description: s.text('description'),
	price: s.integer('price').notNull(),
	interval: s.text('interval').notNull(),
	stripePriceId: s.text('stripe_price_id'),
	maxMembers: s.integer('max_members').default(1).notNull(),
	features: s.text('features').default('').notNull(),
})
