import { db } from '@fit/db'
import { user } from '@fit/db/schema/auth'
import { organisation, plan, planCode, subscription } from '@fit/db/schema/org'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	OrganisationCreateInput,
	OrganisationGetPlanByCodeInput,
	PlanCreateInput,
	PlanDeleteInput,
	PlanUpdateInput,
} from '../schemas/organisation'

export const orgRouter = {
	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/organisation',
			summary: 'Create organisation',
			tags: ['Organisation'],
		})
		.input(OrganisationCreateInput)
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
						organisationSlug: input.slug,
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
		.input(OrganisationGetPlanByCodeInput)
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

	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/organisation/all',
			summary: 'Get all organisations (Dictator only)',
			tags: ['Organisation'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all organisations',
				})
			}

			const orgs = await db.query.organisation.findMany({
				with: {
					creator: {
						columns: {
							name: true,
							email: true,
						},
					},
					members: {
						columns: {
							id: true,
						},
					},
					subscriptions: {
						with: {
							plan: {
								columns: {
									name: true,
								},
							},
						},
					},
				},
			})

			return orgs.map((o) => ({
				...o,
				creatorName: o.creator?.name ?? 'Unknown',
				creatorEmail: o.creator?.email ?? '',
				memberCount: o.members?.length ?? 0,
				planName: o.subscriptions?.[0]?.plan?.name ?? 'No Plan',
			}))
		}),

	// ***************** Plan Management (Dictator Only) *******************
	createPlan: protectedProcedure
		.route({
			method: 'POST',
			path: '/plan',
			summary: 'Create a plan (Dictator only)',
			tags: ['Plan'],
		})
		.input(PlanCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create plans',
				})
			}

			const [newPlan] = await db.insert(plan).values(input).returning()
			return newPlan
		}),

	updatePlan: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/plan',
			summary: 'Update a plan (Dictator only)',
			tags: ['Plan'],
		})
		.input(PlanUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update plans',
				})
			}

			const { id, ...updateData } = input
			const [updatedPlan] = await db
				.update(plan)
				.set(updateData)
				.where(eq(plan.id, id))
				.returning()

			if (!updatedPlan) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Plan not found',
				})
			}

			return updatedPlan
		}),

	deletePlan: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/plan/{id}',
			summary: 'Delete a plan (Dictator only)',
			tags: ['Plan'],
		})
		.input(PlanDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete plans',
				})
			}

			await db.delete(plan).where(eq(plan.id, input.id))
			return { success: true, id: input.id }
		}),

	getAllPlansAdmin: protectedProcedure
		.route({
			method: 'GET',
			path: '/plan/all',
			summary: 'Get all plans including hidden (Dictator only)',
			tags: ['Plan'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all plans',
				})
			}

			const plans = await db.query.plan.findMany()
			return plans
		}),
}
