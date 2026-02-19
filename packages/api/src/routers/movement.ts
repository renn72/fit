import { db } from '@fit/db'
import { movement } from '@fit/db/schema/movement'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	MovementCreateInput,
	MovementGetAllBaseInput,
	MovementGetAllInput,
	MovementGetAllOrgInput,
	MovementGetInput,
	MovementUpdateInput,
} from '../schemas/movement'

export const movementRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/movement/all',
			summary: 'Get all movements (Dictator only)',
			tags: ['Movement'],
		})
		.input(MovementGetAllInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all movements',
				})
			}

			const res = await db.query.movement.findMany({
				limit: input.limit,
				with: {
					organisation: {
						columns: {
							slug: true,
						},
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			return res.map((m) => ({
				...m,
				organisationSlug: m.organisation?.slug,
				creatorName: m.creator?.name ?? 'Unknown',
			}))
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/movement',
			summary: 'Create a movement',
			tags: ['Movement'],
		})
		.input(MovementCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create movements',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newMovement] = await db
				.insert(movement)
				.values({
					...input,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newMovement
		}),

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/movement/org',
			summary: 'Get all movements for an organisation',
			tags: ['Movement'],
		})
		.input(MovementGetAllOrgInput)
		.handler(async ({ input }) => {
			// Get org movements
			const orgMovements = await db.query.movement.findMany({
				where: { organisationId: input.organisationId },
			})

			const overwrittenBaseIds = orgMovements
				.map((m) => m.baseId)
				.filter((id): id is string => id !== null)

			// Get base movements (isBase=true, not overwritten by org)
			const baseMovements = await db.query.movement.findMany({
				where: { isBase: true },
			})

			const availableBaseMovements = baseMovements.filter(
				(bm) => !overwrittenBaseIds.includes(bm.id),
			)

			const allMovements = [
				...orgMovements.map((m) => ({
					...m,
					isBase: false,
					isOverwriteBase: !!m.baseId,
				})),
				...availableBaseMovements.map((bm) => ({
					...bm,
					isBase: true,
					isOverwriteBase: false,
				})),
			]

			if (input.limit) {
				return allMovements.slice(0, input.limit)
			}

			return allMovements
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/movement/:id',
			summary: 'Get a movement by ID',
			tags: ['Movement'],
		})
		.input(MovementGetInput)
		.handler(async ({ input }) => {
			const m = await db.query.movement.findFirst({
				where: { id: input.id },
			})

			return m || null
		}),

	getAllBase: protectedProcedure
		.route({
			method: 'GET',
			path: '/movement/base',
			summary: 'Get all base movements',
			tags: ['Movement'],
		})
		.input(MovementGetAllBaseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view base movements',
				})
			}

			const res = await db.query.movement.findMany({
				where: { isBase: true },
				limit: input.limit,
			})
			return res
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/movement',
			summary: 'Update a movement',
			tags: ['Movement'],
		})
		.input(MovementUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update movements',
				})
			}

			const organisationId = context.session.user.organisationId
			if (!organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			// 1. Check if it's an existing org movement
			const existingOrgMovement = await db.query.movement.findFirst({
				where: {
					id: input.id,
					organisationId: organisationId,
				},
			})

			if (existingOrgMovement) {
				const [updated] = await db
					.update(movement)
					.set({
						name: input.name,
						force: input.force,
						level: input.level,
						mechanic: input.mechanic,
						equipment: input.equipment,
						primaryMuscles: input.primaryMuscles,
						secondaryMuscles: input.secondaryMuscles,
						instructions: input.instructions,
						category: input.category,
						images: input.images,
					})
					.where(eq(movement.id, input.id))
					.returning()
				return updated
			}

			// 2. Check if it's a base movement (to create an override)
			const baseMov = await db.query.movement.findFirst({
				where: {
					id: input.id,
					isBase: true,
				},
			})

			if (baseMov) {
				const [newOverride] = await db
					.insert(movement)
					.values({
						name: input.name,
						force: input.force,
						level: input.level,
						mechanic: input.mechanic,
						equipment: input.equipment,
						primaryMuscles: input.primaryMuscles,
						secondaryMuscles: input.secondaryMuscles,
						instructions: input.instructions,
						category: input.category,
						images: input.images,
						baseId: baseMov.id,
						organisationId,
						creatorId: context.session.user.id,
					})
					.returning()
				return newOverride
			}

			throw new ORPCError('NOT_FOUND', {
				message: 'Movement not found',
			})
		}),
}
