import { db } from '@fit/db'
import {
	session,
	sessionToExercise,
	sessionToSuperSet,
} from '@fit/db/schema/session'

import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	SessionAddExerciseInput,
	SessionAddSuperSetInput,
	SessionCreateInput,
	SessionDeleteInput,
	SessionGetAllOrgInput,
	SessionGetInput,
	SessionRemoveExerciseInput,
	SessionRemoveSuperSetInput,
	SessionUpdateInput,
} from '../schemas/session'

export const sessionRouter = {
	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/session/all',
			summary: 'Get all sessions across all organisations (dictator only)',
			tags: ['Session'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only dictators can view all sessions',
				})
			}

			const sessions = await db.query.session.findMany({
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
				},
				orderBy: (session, { desc }) => [desc(session.createdAt)],
			})

			return sessions.map((s) => ({
				...s,
				creatorName: s.creator?.name ?? null,
				creatorEmail: s.creator?.email ?? null,
				organisationName: s.organisation?.name ?? null,
				organisationSlug: s.organisation?.slug ?? null,
			}))
		}),

	getAllOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/session/org',
			summary: 'Get all sessions for an organisation',
			tags: ['Session'],
		})
		.input(SessionGetAllOrgInput)
		.handler(async ({ input, context }) => {
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to view sessions for this organisation',
				})
			}

			const sessions = await db.query.session.findMany({
				where: { organisationId: input.organisationId },
				with: {
					creator: {
						columns: {
							name: true,
						},
					},
				},
				orderBy: (session, { desc }) => [desc(session.createdAt)],
			})

			return sessions
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/session/:id',
			summary: 'Get a session by ID with all exercises and supersets',
			tags: ['Session'],
		})
		.input(SessionGetInput)
		.handler(async ({ input, context }) => {
			const sessionData = await db.query.session.findFirst({
				where: { id: input.id },
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
					creator: {
						columns: {
							name: true,
						},
					},
				},
			})

			if (!sessionData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Session not found',
				})
			}

			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (sessionData.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view this session',
				})
			}

			return sessionData
		}),

	create: protectedProcedure
		.route({
			method: 'POST',
			path: '/session',
			summary: 'Create a session',
			tags: ['Session'],
		})
		.input(SessionCreateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to create sessions',
				})
			}

			if (!context.session.user.organisationId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const [newSession] = await db
				.insert(session)
				.values({
					...input,
					creatorId: context.session.user.id,
					organisationId: context.session.user.organisationId,
				})
				.returning()

			return newSession
		}),

	update: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/session',
			summary: 'Update a session',
			tags: ['Session'],
		})
		.input(SessionUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update sessions',
				})
			}

			const { id, ...updateData } = input

			const [updated] = await db
				.update(session)
				.set(updateData)
				.where(eq(session.id, id))
				.returning()

			if (!updated) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Session not found',
				})
			}

			return updated
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/session/:id',
			summary: 'Delete a session',
			tags: ['Session'],
		})
		.input(SessionDeleteInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to delete sessions',
				})
			}

			await db.delete(session).where(eq(session.id, input.id))
			return { success: true, id: input.id }
		}),

	// ***************** Session Exercise Operations *******************
	addExercise: protectedProcedure
		.route({
			method: 'POST',
			path: '/session/exercise/add',
			summary: 'Add an exercise to a session',
			tags: ['Session'],
		})
		.input(SessionAddExerciseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify sessions',
				})
			}

			// Verify session exists
			const sessionData = await db.query.session.findFirst({
				where: { id: input.sessionId },
			})

			if (!sessionData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Session not found',
				})
			}

			// Verify exercise exists
			const exerciseData = await db.query.exercise.findFirst({
				where: { id: input.exerciseId },
			})

			if (!exerciseData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Exercise not found',
				})
			}

			const [link] = await db
				.insert(sessionToExercise)
				.values({
					sessionId: input.sessionId,
					exerciseId: input.exerciseId,
					index: input.index,
				})
				.returning()

			return link
		}),

	removeExercise: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/session/exercise/remove',
			summary: 'Remove an exercise from a session',
			tags: ['Session'],
		})
		.input(SessionRemoveExerciseInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify sessions',
				})
			}

			await db
				.delete(sessionToExercise)
				.where(
					and(
						eq(sessionToExercise.sessionId, input.sessionId),
						eq(sessionToExercise.exerciseId, input.exerciseId),
					),
				)

			return { success: true }
		}),

	// ***************** Session SuperSet Operations *******************
	addSuperSet: protectedProcedure
		.route({
			method: 'POST',
			path: '/session/superset/add',
			summary: 'Add a superset to a session',
			tags: ['Session'],
		})
		.input(SessionAddSuperSetInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify sessions',
				})
			}

			// Verify session exists
			const sessionData = await db.query.session.findFirst({
				where: { id: input.sessionId },
			})

			if (!sessionData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'Session not found',
				})
			}

			// Verify superset exists and is marked as isSuperSet
			const superSetData = await db.query.exercise.findFirst({
				where: { id: input.superSetId },
			})

			if (!superSetData) {
				throw new ORPCError('NOT_FOUND', {
					message: 'SuperSet not found',
				})
			}

			if (!superSetData.isSuperSet) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'The specified exercise is not marked as a superset',
				})
			}

			const [link] = await db
				.insert(sessionToSuperSet)
				.values({
					sessionId: input.sessionId,
					superSetId: input.superSetId,
					index: input.index,
				})
				.returning()

			return link
		}),

	removeSuperSet: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/session/superset/remove',
			summary: 'Remove a superset from a session',
			tags: ['Session'],
		})
		.input(SessionRemoveSuperSetInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to modify sessions',
				})
			}

			await db
				.delete(sessionToSuperSet)
				.where(
					and(
						eq(sessionToSuperSet.sessionId, input.sessionId),
						eq(sessionToSuperSet.superSetId, input.superSetId),
					),
				)

			return { success: true }
		}),
}
