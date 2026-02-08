import type { RouterClient } from '@orpc/server'
import { protectedProcedure, publicProcedure } from '../index'
import { orgRouter } from './organisation'

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return 'OK'
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: 'This is private',
			user: context.session?.user,
		}
	}),
	organisation: orgRouter,
}
export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
