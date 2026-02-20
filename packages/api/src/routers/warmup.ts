import { db } from '@fit/db'
import { warmup, warmupGroup } from '@fit/db/schema/warmup'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	WarmupCreateInput,
	WarmupDeleteInput,
	WarmupGetAllInput,
	WarmupGetInput,
	WarmupGroupCreateInput,
	WarmupGroupDeleteInput,
	WarmupGroupGetAllInput,
	WarmupGroupGetInput,
	WarmupGroupUpdateInput,
	WarmupGroupWithWarmupsCreateInput,
	WarmupUpdateInput,
} from '../schemas/warmup'

export const warmupRouter = {
	// ***************** Warmup Group Operations *******************
	getAllGroups: protectedProcedure
		.route({
			method: 'GET',
			path: '/warmup/group/all',
			summary: 'Get all warmup groups for an organisation',
			tags: ['Warmup'],
		})
		.input(WarmupGroupGetAllInput)
		.handler(async ({ input, context }) => {
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to view warmup groups for this organisation',
				})
			}

			const groups = await db.query.warmupGroup.findMany({
				where: { organisationId: input.organisationId },
				with: {
					warmups: true,
					creator: {
						columns: {
							name: true,
						},
					},
				},
				orderBy: (group, { desc }) => [desc(group.createdAt)],
			})

			return groups
		}),

	getGroup: protectedProcedure
		.route({
			method: 'GET',
			path: '/warmup/group/:id',
			summary: 'Get a warmup group by ID',
			tags: ['Warmup'],
		})
		.input(WarmupGroupGetInput)
		.handler(async ({ input, context }) => {
			const group = await db.query.warmupGroup.findFirst({
				where: { id: input.id },
				with: {
					warmups: true,
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			if (!group) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Warmup group not found',
				})
			}

			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (group.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view this warmup group',
				})
			}

			return group
		}),

	createGroup: protectedProcedure
		.route({
			method: 'POST',
			path: '/warmup/group',
			summary: 'Create a warmup group',
			tags: ['Warmup'],
		})
		.input(WarmupGroupCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create warmup groups',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newGroup] = await db
				.insert(warmupGroup)
				.values({
					...input,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newGroup
		}),

	createGroupWithWarmups: protectedProcedure
		.route({
			method: 'POST',
			path: '/warmup/group/with-warmups',
			summary: 'Create a warmup group with warmups in one transaction',
			tags: ['Warmup'],
		})
		.input(WarmupGroupWithWarmupsCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create warmup groups',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newGroup] = await db
				.insert(warmupGroup)
				.values({
					name: input.name,
					description: input.description,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			if (!newGroup) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'Failed to create warmup group',
				})
			}

			const warmupsData = input.warmups.map((w) => ({
				...w,
				warmupGroupId: newGroup.id,
			}))

			await db.insert(warmup).values(warmupsData)

			return {
				...newGroup,
				warmups: warmupsData,
			}
		}),

	updateGroup: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/warmup/group',
			summary: 'Update a warmup group',
			tags: ['Warmup'],
		})
		.input(WarmupGroupUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update warmup groups',
				})
			}

			const { id, ...updateData } = input

			const [updated] = await db
				.update(warmupGroup)
				.set(updateData)
				.where(eq(warmupGroup.id, id))
				.returning()

			if (!updated) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Warmup group not found',
				})
			}

			return updated
		}),

	deleteGroup: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/warmup/group/:id',
			summary: 'Delete a warmup group',
			tags: ['Warmup'],
		})
		.input(WarmupGroupDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete warmup groups',
				})
			}

			await db.delete(warmupGroup).where(eq(warmupGroup.id, input.id))
			return { success: true, id: input.id }
		}),

	// ***************** Warmup Operations *******************
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/warmup/all',
			summary: 'Get all warmups for a warmup group',
			tags: ['Warmup'],
		})
		.input(WarmupGetAllInput)
		.handler(async ({ input }) => {
			const warmups = await db.query.warmup.findMany({
				where: { warmupGroupId: input.warmupGroupId },
				orderBy: (warmup, { desc }) => [desc(warmup.createdAt)],
			})

			return warmups
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/warmup/:id',
			summary: 'Get a warmup by ID',
			tags: ['Warmup'],
		})
		.input(WarmupGetInput)
		.handler(async ({ input }) => {
			const warmupData = await db.query.warmup.findFirst({
				where: { id: input.id },
				with: {
					warmupGroup: true,
				},
			})

			if (!warmupData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Warmup not found',
				})
			}

			return warmupData
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/warmup',
			summary: 'Create a warmup',
			tags: ['Warmup'],
		})
		.input(WarmupCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create warmups',
				})
			}

			// Verify the warmup group exists
			const group = await db.query.warmupGroup.findFirst({
				where: { id: input.warmupGroupId },
			})

			if (!group) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Warmup group not found',
				})
			}

			const [newWarmup] = await db.insert(warmup).values(input).returning()
			return newWarmup
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/warmup',
			summary: 'Update a warmup',
			tags: ['Warmup'],
		})
		.input(WarmupUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update warmups',
				})
			}

			const { id, ...updateData } = input

			const [updated] = await db
				.update(warmup)
				.set(updateData)
				.where(eq(warmup.id, id))
				.returning()

			if (!updated) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Warmup not found',
				})
			}

			return updated
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/warmup/:id',
			summary: 'Delete a warmup',
			tags: ['Warmup'],
		})
		.input(WarmupDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete warmups',
				})
			}

			await db.delete(warmup).where(eq(warmup.id, input.id))
			return { success: true, id: input.id }
		}),
}
