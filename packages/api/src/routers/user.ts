import { db } from '@fit/db'

import { z } from 'zod'
import { protectedProcedure } from '../index'

export const userRouter = {
	getWithOrg: protectedProcedure
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
}
