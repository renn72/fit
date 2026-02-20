import { adminSetupRouter } from './admin-setup'
import { exerciseRouter } from './exercise'
import { ingredientRouter } from './ingredient'
import { movementRouter } from './movement'
import { orgRouter } from './organisation'
import { recipeRouter } from './recipe'
import { userRouter } from './user'
import { warmupRouter } from './warmup'
import { workoutRouter } from './workout'

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
	movement: movementRouter,
	exercise: exerciseRouter,
	ingredient: ingredientRouter,
	recipe: recipeRouter,
	workout: workoutRouter,
	warmup: warmupRouter,
}
export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
