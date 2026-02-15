import { db } from '@fit/db'
import { user } from '@fit/db/schema/auth'
import { organisation, planCode, subscription } from '@fit/db/schema/org'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { protectedProcedure } from '../index'

export const orgRouter = {
	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/organisation',
			summary: 'Create organisation',
			tags: ['Organisation'],
		})
		.input(
			z.object({
				name: z.string().min(1).max(32),
				slug: z.string().min(1).max(32),
				timezone: z.string().min(1),
				planId: z.string().min(1),
				code: z.string().optional(),
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

			// If plan is hidden, a code MUST be provided and valid
			if (selectedPlan.hidden && !input.code) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'A valid access code is required for this plan',
				})
			}

			return await db.transaction(async (tx) => {
				if (input.code) {
					const codeRecord = await tx.query.planCode.findFirst({
						where: {
							code: input.code,
							planId: input.planId,
							isUsed: false,
						},
					})

					if (!codeRecord) {
						throw new ORPCError('BAD_REQUEST', {
							message: 'Invalid or already used access code',
						})
					}

					await tx
						.update(planCode)
						.set({ isUsed: true })
						.where(eq(planCode.id, codeRecord.id))
				}

				const [newOrg] = await tx
					.insert(organisation)
					.values({
						name: input.name,
						slug: input.slug,
						timezone: input.timezone,
						state: 'created',
						creatorId: context.session.user.id,
					})
					.returning({ id: organisation.id })

				if (!newOrg) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to create organisation',
					})
				}

				await tx
					.update(user)
					.set({
						organisationId: newOrg.id,
						organisationCreatorId: newOrg.id,
					})
					.where(eq(user.id, context.session.user.id))

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

	getAllSlugs: protectedProcedure
		.route({
			method: 'GET',
			path: '/organisation/slugs',
			summary: 'Get all slugs',
			tags: ['Organisation'],
		})
		.handler(async () => {
			const res = await db
				.select({ slug: organisation.slug })
				.from(organisation)
			return res.map((r) => r.slug)
		}),

	getAllPlans: protectedProcedure
		.route({
			method: 'GET',
			path: '/organisation/plans',
			summary: 'Get all plans',
			tags: ['Organisation'],
		})
		.handler(async () => {
			const res = await db.query.plan.findMany({
				where: { hidden: false },
			})
			return res
		}),

	getPlanByCode: protectedProcedure
		.route({
			method: 'GET',
			path: '/organisation/plan-by-code/{code}',
			summary: 'Get plan by code',
			tags: ['Organisation'],
		})
		.input(z.object({ code: z.string().min(1) }))
		.handler(async ({ input }) => {
			const codeRecord = await db.query.planCode.findFirst({
				where: {
					code: input.code,
					isUsed: false,
				},
				with: {
					plan: true,
				},
			})

			if (!codeRecord) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Invalid or already used access code',
				})
			}

			return codeRecord.plan
		}),
}
