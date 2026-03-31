import { call, ORPCError } from '@orpc/server'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@fit/db'
import { ingredient } from '../../../db/src/schema/ingredient'
import {
	dailyLogExercise,
	dailyLogMeal,
	dailyLogSet,
	dailyLogWarmup,
	dailyLogWorkout,
} from '../../../db/src/schema/daily-log'
import { movement } from '../../../db/src/schema/movement'
import { userBlock, userExercise, userWarmup, userWorkout } from '../../../db/src/schema/user-block'
import { userIngredient, userMenu, userRecipe } from '../../../db/src/schema/user-menu'
import { adminSetupRouter } from '../../src/routers/admin-setup'
import { dailyLogRouter } from '../../src/routers/daily-log'
import { createOrgFixture } from '../fixtures/org'
import { createDictator, createItemUpdater, createRegularUser } from '../fixtures/user'
import { createTestContext } from '../helpers/auth'
import { initTestDB, resetDatabase } from '../helpers/db'

async function assignUserMenuAndBlock({
	userId,
	organisationId,
	creatorId,
}: {
	userId: string
	organisationId: string
	creatorId: string
}) {
	const oatsId = `ingredient-${crypto.randomUUID()}`
	const movementId = `movement-${crypto.randomUUID()}`
	const menuId = `user-menu-${crypto.randomUUID()}`
	const recipeId = `user-recipe-${crypto.randomUUID()}`
	const blockId = `user-block-${crypto.randomUUID()}`
	const workoutId = `user-workout-${crypto.randomUUID()}`
	const warmupId = `user-warmup-${crypto.randomUUID()}`
	const exerciseId = `user-exercise-${crypto.randomUUID()}`

	await db.insert(ingredient).values({
		id: oatsId,
		name: 'Oats',
		organisationId,
		creatorId,
		calories: 120,
		protein: 10,
		fat: 4,
		carbohydrate: 18,
		serveSize: 100,
		serveUnit: 'grams',
		isUserCreated: false,
	})

	await db.insert(movement).values({
		id: movementId,
		name: 'Back Squat',
		organisationId,
		creatorId,
		category: 'Strength',
		instructions: 'Squat down and stand up.',
		primaryMuscles: 'Quads',
		secondaryMuscles: 'Glutes',
		level: 'Beginner',
		force: 'Push',
		mechanic: 'Compound',
		equipment: 'Barbell',
		images: '',
	})

	await db.insert(userMenu).values({
		id: menuId,
		userId,
		name: 'Daily Fuel',
		isActive: true,
	})

	await db.insert(userRecipe).values({
		id: recipeId,
		userMenuId: menuId,
		mealIndex: 0,
		recipeIndex: 0,
		name: 'Oats Bowl',
		description: 'Breakfast oats',
	})

	await db.insert(userIngredient).values({
		id: `user-ingredient-${crypto.randomUUID()}`,
		userMenuId: menuId,
		ingredientId: oatsId,
		mealIndex: 0,
		recipeIndex: 0,
		serveSize: 100,
		serveUnit: 'grams',
	})

	await db.insert(userBlock).values({
		id: blockId,
		userId,
		name: 'Strength Block',
		isActive: true,
	})

	await db.insert(userWorkout).values({
		id: workoutId,
		userBlockId: blockId,
		dayIndex: 0,
		workoutIndex: 0,
		name: 'Lower Body',
	})

	await db.insert(userWarmup).values({
		id: warmupId,
		userWorkoutId: workoutId,
		sourceWarmupId: 'warmup-source-1',
		warmupIndex: 0,
		name: 'Bike',
	})

	await db.insert(userExercise).values({
		id: exerciseId,
		userWorkoutId: workoutId,
		sourceExerciseId: 'exercise-source-1',
		movementId,
		exerciseIndex: 0,
		label: 'Working Set',
		sets: 3,
		reps: 5,
		repUnit: 'reps',
		targetRpe: 8,
		restTime: 120,
		restUnit: 'seconds',
		notes: 'Drive up fast',
	})

	return { oatsId, movementId, menuId, recipeId, blockId, workoutId, exerciseId }
}

describe('Daily Log Router', () => {
	beforeAll(async () => {
		await initTestDB()
	})

	beforeEach(async () => {
		await resetDatabase()
	})

	it('generates nested daily logs from assigned menus and blocks', async () => {
		const dictator = await createDictator()
		const org = await createOrgFixture(dictator)
		const trainee = await createRegularUser({
			organisationId: org.id,
			organisationSlug: org.slug,
		})

		await assignUserMenuAndBlock({
			userId: trainee.id,
			organisationId: org.id,
			creatorId: dictator.id,
		})

		const result = await call(
			adminSetupRouter.generateDailyLogs,
			{ organisationId: org.id },
			{
				context: createTestContext(dictator),
			},
		)

		expect(result.logsCreated).toBeGreaterThan(0)

		const logs = await db.query.dailyLog.findMany({
			where: { userId: trainee.id },
		})
		expect(logs.length).toBeGreaterThan(0)

		const createdMeals = await db.query.dailyLogMeal.findMany({
			where: { dailyLogId: logs[0]!.id },
		})
		expect(createdMeals[0]).toMatchObject({
			name: 'Oats Bowl',
			mealIndex: 0,
			recipeId: expect.any(String),
		})

		const createdWorkouts = await db.query.dailyLogWorkout.findMany({
			where: { dailyLogId: logs[0]!.id },
		})
		expect(createdWorkouts[0]).toMatchObject({
			name: 'Lower Body',
			userWorkoutId: expect.any(String),
			energyLevel: expect.stringMatching(/^[abcd]$/),
		})

		const createdWarmups = await db.query.dailyLogWarmup.findMany({
			where: { dailyLogWorkoutId: createdWorkouts[0]!.id },
		})
		expect(createdWarmups[0]?.name).toBe('Bike')

		const createdExercises = await db.query.dailyLogExercise.findMany({
			where: { dailyLogWorkoutId: createdWorkouts[0]!.id },
		})
		expect(createdExercises[0]).toMatchObject({
			exerciseIndex: 0,
			label: 'Working Set',
			targetSets: 3,
		})

		const createdSets = await db.query.dailyLogSet.findMany({
			where: { dailyLogExerciseId: createdExercises[0]!.id },
		})
		expect(createdSets).toHaveLength(3)
		expect(createdSets[0]).toMatchObject({
			setIndex: 0,
			reps: expect.any(Number),
		})
	})

	it('returns user logs for org admins and rejects cross-org access', async () => {
		const owner = await createItemUpdater()
		const org = await createOrgFixture(owner)
		owner.organisationId = org.id
		owner.organisationSlug = org.slug
		const trainee = await createRegularUser({
			organisationId: org.id,
			organisationSlug: org.slug,
		})
		const outsider = await createRegularUser()
		const outsiderOrg = await createOrgFixture(outsider)
		const outsiderAdmin = await createItemUpdater({
			organisationId: outsiderOrg.id,
			organisationSlug: outsiderOrg.slug,
		})

		await assignUserMenuAndBlock({
			userId: trainee.id,
			organisationId: org.id,
			creatorId: owner.id,
		})

		await call(
			adminSetupRouter.generateDailyLogs,
			{ organisationId: org.id },
			{
				context: createTestContext(
					await createDictator({
						organisationId: org.id,
						organisationSlug: org.slug,
					}),
				),
			},
		)

		const result = await call(
			dailyLogRouter.getByUser,
			{ userId: trainee.id },
			{
				context: createTestContext(owner),
			},
		)

		expect(result.length).toBeGreaterThan(0)
		expect(result[0]?.meals[0]).toMatchObject({
			name: 'Oats Bowl',
		})
		expect(result[0]?.workouts[0]?.exercises[0]?.sets).toHaveLength(3)

		await expect(
			call(
				dailyLogRouter.getByUser,
				{ userId: trainee.id },
				{
					context: createTestContext(outsiderAdmin),
				},
			),
		).rejects.toThrow(ORPCError)
	})
})
