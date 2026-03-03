import { adminSetupRouter } from './admin-setup'
import { aiRouter } from './ai'
import { blockTemplateRouter } from './block-template'
import { exerciseRouter } from './exercise'
import { ingredientRouter } from './ingredient'
import { menuTemplateRouter } from './menu-template'
import { movementRouter } from './movement'
import { orgRouter } from './organisation'
import { recipeRouter } from './recipe'
import { subscriptionRouter } from './subscription'
import { userRouter } from './user'
import { userMenuRouter } from './user-menu'
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
	userMenu: userMenuRouter,
	adminSetup: adminSetupRouter,
	movement: movementRouter,
	exercise: exerciseRouter,
	ingredient: ingredientRouter,
	recipe: recipeRouter,
	workout: workoutRouter,
	warmup: warmupRouter,
	blockTemplate: blockTemplateRouter,
	menuTemplate: menuTemplateRouter,
	subscription: subscriptionRouter,
	ai: aiRouter,
}
export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
