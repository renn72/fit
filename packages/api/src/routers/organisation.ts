import { db } from '@fit/db'
import { organisation, plan, subscription } from '@fit/db/schema/org'

import { ORPCError } from '@orpc/server'
import z from 'zod'
import { protectedProcedure } from '../index'

export const orgRouter = {
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(32),
				slug: z.string().min(1).max(32),
				planId: z.string().min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			const existing = await db.query.organisation.findFirst({
				where: {
					slug: input.slug,
				},
			})

			if (existing) {
				throw new ORPCError('CONFLICT', {
					message: 'Organisation with this slug already exists',
				})
			}

			const selectedPlan = await db.query.plan.findFirst({
				where: {
					id: input.planId,
				},
			})

			if (!selectedPlan) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Plan not found',
				})
			}

			return await db.transaction(async (tx) => {
				const [newOrg] = await tx
					.insert(organisation)
					.values({
						name: input.name,
						slug: input.slug,
						state: 'created',
						creatorId: context.session.user.id,
					})
					.returning({ id: organisation.id })

				if (!newOrg) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to create organisation',
					})
				}

				const oneYearFromNow = new Date()
				oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

				await tx.insert(subscription).values({
					organisationId: newOrg.id,
					planId: input.planId,
					status: 'created',
					currentPeriodEnd: oneYearFromNow,
				})

				return newOrg
			})
		}),

	getAllSlugs: protectedProcedure.handler(async () => {
		const res = await db.select({ slug: organisation.slug }).from(organisation)
		return res.map((r) => r.slug)
	}),

	getAllPlans: protectedProcedure.handler(async () => {
		const res = await db.query.plan.findMany()
		return res
	}),
}
