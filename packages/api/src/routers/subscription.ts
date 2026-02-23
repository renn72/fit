import { db } from '@fit/db'
import { subscription } from '@fit/db/schema/org'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	SubscriptionGetByOrgInput,
	SubscriptionGetInput,
	SubscriptionUpdateInput,
} from '../schemas/subscription'

export const subscriptionRouter = {
	// Get subscription by ID (with plan details)
	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/subscription/{id}',
			summary: 'Get subscription by ID',
			tags: ['Subscription'],
		})
		.input(SubscriptionGetInput)
		.handler(async ({ input }) => {
			const sub = await db.query.subscription.findFirst({
				where: { id: input.id },
				with: {
					plan: true,
					organisation: {
						columns: {
							name: true,
							slug: true,
						},
					},
				},
			})

			if (!sub) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Subscription not found',
				})
			}

			return sub
		}),

	// Get subscription by organisation ID
	getByOrganisation: protectedProcedure
		.route({
			method: 'GET',
			path: '/subscription/org/{organisationId}',
			summary: 'Get subscription by organisation ID',
			tags: ['Subscription'],
		})
		.input(SubscriptionGetByOrgInput)
		.handler(async ({ input }) => {
			const sub = await db.query.subscription.findFirst({
				where: { organisationId: input.organisationId },
				with: {
					plan: true,
					organisation: {
						columns: {
							name: true,
							slug: true,
						},
					},
				},
			})

			if (!sub) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Subscription not found for this organisation',
				})
			}

			return sub
		}),

	// Update subscription (Dictator only - for discounts and bonuses)
	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/subscription',
			summary: 'Update subscription (Dictator only)',
			tags: ['Subscription'],
		})
		.input(SubscriptionUpdateInput)
		.handler(async ({ input, context }) => {
			// Check dictator permission
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update subscriptions',
				})
			}

			const { id, ...updateData } = input

			// Convert timestamps if provided
			const data: any = { ...updateData }
			if (updateData.discountExpiresAt) {
				data.discountExpiresAt = new Date(updateData.discountExpiresAt)
			}
			if (updateData.bonusExpiresAt) {
				data.bonusExpiresAt = new Date(updateData.bonusExpiresAt)
			}

			const [updatedSub] = await db
				.update(subscription)
				.set(data)
				.where(eq(subscription.id, id))
				.returning()

			if (!updatedSub) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Subscription not found',
				})
			}

			return updatedSub
		}),

	// Get all subscriptions (Dictator only)
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/subscription/all',
			summary: 'Get all subscriptions (Dictator only)',
			tags: ['Subscription'],
		})
		.handler(async ({ context }) => {
			// Check dictator permission
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all subscriptions',
				})
			}

			const subs = await db.query.subscription.findMany({
				with: {
					plan: true,
					organisation: {
						columns: {
							name: true,
							slug: true,
						},
					},
				},
			})

			// Calculate effective limits and display prices
			return subs.map((sub) => {
				const plan = sub.plan
				return {
					...sub,
					effectiveMaxMembers: (plan?.maxMembers ?? 0) + sub.bonusMembers,
					effectiveMaxTrainers: (plan?.maxTrainers ?? 0) + sub.bonusTrainers,
					discountedPriceMonthly: sub.discountType
						? sub.discountType === 'percentage'
							? Math.round(
									(plan?.priceMonthly ?? 0) *
										(1 - (sub.discountValue ?? 0) / 100),
								)
							: Math.max(
									0,
									(plan?.priceMonthly ?? 0) - (sub.discountValue ?? 0),
								)
						: (plan?.priceMonthly ?? 0),
					discountedPriceYearly: sub.discountType
						? sub.discountType === 'percentage'
							? Math.round(
									(plan?.priceYearly ?? 0) *
										(1 - (sub.discountValue ?? 0) / 100),
								)
							: Math.max(0, (plan?.priceYearly ?? 0) - (sub.discountValue ?? 0))
						: (plan?.priceYearly ?? 0),
					hasActiveDiscount:
						!!sub.discountType &&
						(!sub.discountExpiresAt ||
							new Date(sub.discountExpiresAt) > new Date()),
					hasActiveBonus:
						(sub.bonusMembers > 0 || sub.bonusTrainers > 0) &&
						(!sub.bonusExpiresAt || new Date(sub.bonusExpiresAt) > new Date()),
				}
			})
		}),
}
