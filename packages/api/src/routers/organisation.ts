import { db } from '@fit/db'
import { organisation } from '@fit/db/schema/org'

import z from 'zod'
import { protectedProcedure } from '../index'

export const orgRouter = {
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(32),
				slug: z.string().min(1).max(32),
			}),
		)
		.handler(async ({ input }) => {
			const res = await db.insert(organisation).values({
				...input,
				state: 'created',
			})

			return res
		}),
}
