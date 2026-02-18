import { adminSetupRouter } from './admin-setup'
import { exerciseRouter } from './exercise'
import { ingredientRouter } from './ingredient'
import { orgRouter } from './organisation'
import { recipeRouter } from './recipe'
import { userRouter } from './user'

import type { RouterClient } from '@orpc/server'
import { protectedProcedure, publicProcedure } from '../index'

export const appRouter = {
	healthCheck: publicProcedure
		.route({
			method: 'GET',
			path: '/health-check',
			summary: 'Health check',
			tags: ['App'],
		})
		.handler(() => {
			return 'OK'
		}),
	privateData: protectedProcedure
		.route({
			method: 'GET',
			path: '/private-data',
			summary: 'Get private data',
			tags: ['App'],
		})
		.handler(({ context }) => {
			return {
				message: 'This is private',
				user: context.session?.user,
			}
		}),
	organisation: orgRouter,
	user: userRouter,
	adminSetup: adminSetupRouter,
	exercise: exerciseRouter,
	ingredient: ingredientRouter,
	recipe: recipeRouter,
}
export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
