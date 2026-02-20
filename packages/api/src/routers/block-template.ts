import { db } from '@fit/db'
import {
	blockTemplate,
	blockTemplateToWorkout,
} from '@fit/db/schema/block-template'

import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	BlockTemplateAddWorkoutInput,
	BlockTemplateCreateInput,
	BlockTemplateDeleteInput,
	BlockTemplateGetAllOrgInput,
	BlockTemplateGetInput,
	BlockTemplateRemoveWorkoutInput,
	BlockTemplateUpdateInput,
} from '../schemas/block-template'

export const blockTemplateRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/block-template/all',
			summary:
				'Get all block templates across all organisations (dictator only)',
			tags: ['Block Template'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only dictators can view all block templates',
				})
			}

			const blockTemplates = await db.query.blockTemplate.findMany({
				with: {
					creator: {
						columns: {
							name: true,
							email: true,
						},
					},
					organisation: {
						columns: {
							name: true,
							slug: true,
						},
					},
					workouts: {
						with: {
							workout: true,
						},
						orderBy: (link, { asc }) => [asc(link.index)],
					},
				},
				orderBy: (blockTemplate, { desc }) => [desc(blockTemplate.createdAt)],
			})

			return blockTemplates.map((bt) => ({
				...bt,
				creatorName: bt.creator?.name ?? null,
				creatorEmail: bt.creator?.email ?? null,
				organisationName: bt.organisation?.name ?? null,
				organisationSlug: bt.organisation?.slug ?? null,
			}))
		}),

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/block-template/org',
			summary: 'Get all block templates for an organisation',
			tags: ['Block Template'],
		})
		.input(BlockTemplateGetAllOrgInput)
		.handler(async ({ input, context }) => {
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to view block templates for this organisation',
				})
			}

			const blockTemplates = await db.query.blockTemplate.findMany({
				where: { organisationId: input.organisationId },
				with: {
					creator: {
						columns: {
							name: true,
						},
					},
					workouts: {
						with: {
							workout: {
								with: {
									exercises: {
										with: {
											exercise: {
												with: {
													movement: {
														columns: {
															name: true,
														},
													},
												},
											},
										},
										orderBy: (link, { asc }) => [asc(link.index)],
									},
									superSets: {
										with: {
											superSet: {
												with: {
													superSetExercises: {
														with: {
															exercise: {
																with: {
																	movement: {
																		columns: {
																			name: true,
																		},
																	},
																},
															},
														},
													},
												},
											},
										},
										orderBy: (link, { asc }) => [asc(link.index)],
									},
									warmupGroup: {
										with: {
											warmups: true,
										},
									},
								},
							},
						},
						orderBy: (link, { asc }) => [asc(link.index)],
					},
				},
				orderBy: (blockTemplate, { desc }) => [desc(blockTemplate.createdAt)],
			})

			return blockTemplates
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/block-template/:id',
			summary: 'Get a block template by ID with all workouts',
			tags: ['Block Template'],
		})
		.input(BlockTemplateGetInput)
		.handler(async ({ input, context }) => {
			const blockTemplateData = await db.query.blockTemplate.findFirst({
				where: { id: input.id },
				with: {
					workouts: {
						with: {
							workout: true,
						},
						orderBy: (link, { asc }) => [asc(link.index)],
					},
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			if (!blockTemplateData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Block template not found',
				})
			}

			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (blockTemplateData.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view this block template',
				})
			}

			return blockTemplateData
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/block-template',
			summary: 'Create a block template',
			tags: ['Block Template'],
		})
		.input(BlockTemplateCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create block templates',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newBlockTemplate] = await db
				.insert(blockTemplate)
				.values({
					...input,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newBlockTemplate
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/block-template',
			summary: 'Update a block template',
			tags: ['Block Template'],
		})
		.input(BlockTemplateUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update block templates',
				})
			}

			const { id, ...updateData } = input

			const [updated] = await db
				.update(blockTemplate)
				.set(updateData)
				.where(eq(blockTemplate.id, id))
				.returning()

			if (!updated) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Block template not found',
				})
			}

			return updated
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/block-template/:id',
			summary: 'Delete a block template',
			tags: ['Block Template'],
		})
		.input(BlockTemplateDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete block templates',
				})
			}

			await db.delete(blockTemplate).where(eq(blockTemplate.id, input.id))
			return { success: true, id: input.id }
		}),

	// ***************** Block Template Workout Operations *******************
	addWorkout: protectedProcedure
		.route({
			method: 'POST',
			path: '/block-template/workout/add',
			summary: 'Add a workout to a block template',
			tags: ['Block Template'],
		})
		.input(BlockTemplateAddWorkoutInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify block templates',
				})
			}

			// Verify block template exists
			const blockTemplateData = await db.query.blockTemplate.findFirst({
				where: { id: input.blockTemplateId },
			})

			if (!blockTemplateData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Block template not found',
				})
			}

			// Verify workout exists
			const workoutData = await db.query.workout.findFirst({
				where: { id: input.workoutId },
			})

			if (!workoutData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Workout not found',
				})
			}

			const [link] = await db
				.insert(blockTemplateToWorkout)
				.values({
					blockTemplateId: input.blockTemplateId,
					workoutId: input.workoutId,
					index: input.index,
				})
				.returning()

			return link
		}),

	removeWorkout: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/block-template/workout/remove',
			summary: 'Remove a workout from a block template',
			tags: ['Block Template'],
		})
		.input(BlockTemplateRemoveWorkoutInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify block templates',
				})
			}

			await db
				.delete(blockTemplateToWorkout)
				.where(
					and(
						eq(blockTemplateToWorkout.blockTemplateId, input.blockTemplateId),
						eq(blockTemplateToWorkout.workoutId, input.workoutId),
					),
				)

			return { success: true }
		}),
}
