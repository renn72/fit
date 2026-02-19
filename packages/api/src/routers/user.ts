import { db } from '@fit/db'

import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { protectedProcedure } from '../index'

export const userRouter = {
	getWithOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/user/{id}',
			summary: 'Get user with organization',
			tags: ['User'],
		})
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const res = await db.query.user.findFirst({
				where: {
					id: input.id,
				},
				with: {
					organisationMember: true,
				},
			})
			return res
		}),

	getAll: protectedProcedure
		.route({
			method: 'GET',
			path: '/user/all',
			summary: 'Get all users (Dictator only)',
			tags: ['User'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view all users',
				})
			}

			const users = await db.query.user.findMany({
				with: {
					organisationMember: {
						columns: {
							name: true,
							slug: true,
						},
					},
				},
			})

			return users.map((u) => ({
				...u,
				organisationName: u.organisationMember?.name ?? 'None',
				organisationSlug: u.organisationMember?.slug ?? '',
			}))
		}),
}
