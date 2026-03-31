import { call } from '@orpc/server'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { exerciseRouter } from '../../src/routers/exercise'
import { createExerciseFixture } from '../fixtures/exercise'
import { createMovementFixture } from '../fixtures/movement'
import { createOrgFixture } from '../fixtures/org'
import { createItemUpdater, createRegularUser } from '../fixtures/user'
import { createTestContext } from '../helpers/auth'
import { initTestDB, resetDatabase } from '../helpers/db'

describe('Exercise Router DB Regression', () => {
	beforeAll(async () => {
		await initTestDB()
	})

	beforeEach(async () => {
		await resetDatabase()
	})

	it('keeps the transaction-backed delete path working', async () => {
		const itemUpdater = await createItemUpdater()
		const org = await createOrgFixture(itemUpdater)
		const movement = await createMovementFixture()
		const testExercise = await createExerciseFixture({
			organisationId: org.id,
			creatorId: itemUpdater.id,
			movementId: movement.id,
		})

		const result = await call(
			exerciseRouter.delete,
			{ id: testExercise.id },
			{
				context: createTestContext(itemUpdater),
			},
		)

		expect(result).toEqual({
			success: true,
			id: testExercise.id,
		})
	})

	it('can still create auth fixtures after the prior delete test reset', async () => {
		await expect(createRegularUser()).resolves.toMatchObject({
			name: 'Test User',
		})
	})
})
