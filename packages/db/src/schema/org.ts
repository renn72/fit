import { user } from './auth'

import { sql } from 'drizzle-orm'
import * as s from 'drizzle-orm/sqlite-core'
import { v4 as uuid } from 'uuid'

export const organisation = s.sqliteTable(
	'organisation',
	{
		id: s
			.text('id')
			.primaryKey()
			.$defaultFn(() => uuid()),
		name: s.text('name').notNull(),
		slug: s.text('slug').notNull().unique(),
		timezone: s.text('timezone').notNull().default('UTC'),
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
	},
	(table) => [s.index('user_organisationSlug_idx').on(table.slug)],
)

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
	// Discount fields
	discountType: s.text('discount_type'), // 'percentage' | 'fixed'
	discountValue: s.integer('discount_value'), // e.g., 20 for 20% or 5000 for $50
	discountReason: s.text('discount_reason'),
	discountExpiresAt: s.integer('discount_expires_at', { mode: 'timestamp_ms' }),
	// Bonus fields
	bonusMembers: s.integer('bonus_members').default(0).notNull(),
	bonusTrainers: s.integer('bonus_trainers').default(0).notNull(),
	bonusReason: s.text('bonus_reason'),
	bonusExpiresAt: s.integer('bonus_expires_at', { mode: 'timestamp_ms' }),
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

export const plan = s.sqliteTable('plan', {
	id: s
		.text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	name: s.text('name').notNull(),
	description: s.text('description').notNull(),
	features: s.text('features').default('').notNull(),
	cta: s.text('cta').notNull(),
	priceMonthly: s.integer('price_monthly').notNull(),
	priceYearly: s.integer('price_yearly').notNull(),
	stripePriceId: s.text('stripe_price_id'),
	maxMembers: s.integer('max_members').default(1).notNull(),
	maxTrainers: s.integer('max_trainers').default(1).notNull(),
	tags: s.text('tags').default('').notNull(),
	hidden: s.integer('hidden', { mode: 'boolean' }).default(false).notNull(),
})

export const planCode = s.sqliteTable('plan_code', {
	id: s
		.text('id')
		.primaryKey()
		.$defaultFn(() => uuid()),
	code: s.text('code').notNull().unique(),
	planId: s
		.text('plan_id')
		.references(() => plan.id, { onDelete: 'cascade' })
		.notNull(),
	isUsed: s.integer('is_used', { mode: 'boolean' }).default(false).notNull(),
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
