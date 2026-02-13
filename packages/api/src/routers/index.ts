import type { RouterClient } from '@orpc/server'
import { protectedProcedure, publicProcedure } from '../index'
import { adminSetupRouter } from './admin-setup'
import { orgRouter } from './organisation'
import { userRouter } from './user'

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
	user: userRouter,
	adminSetup: adminSetupRouter,
}
export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
