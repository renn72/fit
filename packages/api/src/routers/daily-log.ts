import { db } from '@fit/db'

import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { protectedProcedure } from '../index'

function getMetaTags(metaTags: string | null | undefined): string[] {
	return (metaTags ?? '')
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean)
}

async function assertDailyLogAccess({
	targetUserId,
	context,
}: {
	targetUserId: string
	context: any
}) {
	const sessionUser = context.session.user
	const metaTags = getMetaTags(sessionUser.metaTags)
	const isDictator = metaTags.includes('dictator')
	const canManageOrgUsers = isDictator || metaTags.includes('itemUpdater')

	if (targetUserId === sessionUser.id || isDictator) {
		return
	}

	if (!canManageOrgUsers || !sessionUser.organisationId) {
		throw new ORPCError('FORBIDDEN', {
			message: 'You do not have permission to view logs for this user',
		})
	}

	const targetUser = await db.query.user.findFirst({
		where: { id: targetUserId },
		columns: {
			id: true,
			organisationId: true,
		},
	})

	if (!targetUser || targetUser.organisationId !== sessionUser.organisationId) {
		throw new ORPCError('FORBIDDEN', {
			message: 'You do not have permission to view logs for this user',
		})
	}
}

export const dailyLogRouter = {
	getByUser: protectedProcedure
		.route({
			method: 'GET',
			path: '/daily-log/by-user',
			summary: 'Get all daily logs for a specific user',
			tags: ['Daily Log'],
		})
		.input(
			z.object({
				userId: z.string().min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			await assertDailyLogAccess({
				targetUserId: input.userId,
				context,
			})

			return await db.query.dailyLog.findMany({
				where: { userId: input.userId },
				with: {
					meals: {
						orderBy: (meal, { asc }) => [asc(meal.mealIndex)],
					},
					workouts: {
						orderBy: (workout, { asc }) => [asc(workout.workoutIndex)],
						with: {
							warmups: {
								orderBy: (warmup, { asc }) => [asc(warmup.warmupIndex)],
							},
							exercises: {
								orderBy: (exercise, { asc }) => [asc(exercise.exerciseIndex)],
								with: {
									movement: {
										columns: {
											name: true,
										},
									},
									sets: {
										orderBy: (set, { asc }) => [asc(set.setIndex)],
									},
								},
							},
						},
					},
				},
				orderBy: (dailyLog, { desc }) => [desc(dailyLog.createdAt)],
			})
		}),
}
