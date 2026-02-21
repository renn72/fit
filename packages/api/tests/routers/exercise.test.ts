import { call, ORPCError } from '@orpc/server'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { exerciseRouter } from '../../src/routers/exercise'
import { createExerciseFixture, createSuperSet } from '../fixtures/exercise'
import { createMovementFixture } from '../fixtures/movement'
import { createOrgFixture } from '../fixtures/org'
import {
	createDictator,
	createItemUpdater,
	createRegularUser,
} from '../fixtures/user'
import { createTestContext } from '../helpers/auth'
import { initTestDB, resetDatabase } from '../helpers/db'

describe('Exercise Router', () => {
	beforeAll(async () => {
		await initTestDB()
	})

	beforeEach(async () => {
		await resetDatabase()
	})

	describe('getAll', () => {
		it('should return all exercises for dictator', async () => {
			const dictator = await createDictator()
			const org = await createOrgFixture(dictator)
			const movement = await createMovementFixture()
			await createExerciseFixture({
				name: 'Test Exercise',
				organisationId: org.id,
				creatorId: dictator.id,
				movementId: movement.id,
			})

			const result = await call(exerciseRouter.getAll, undefined, {
				context: createTestContext(dictator),
			})

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe('Test Exercise')
			expect(result[0].movementName).toBe(movement.name)
			expect(result[0].organisationName).toBe(org.name)
		})

		it('should throw FORBIDDEN for regular user', async () => {
			const user = await createRegularUser()

			await expect(
				call(exerciseRouter.getAll, undefined, {
					context: createTestContext(user),
				}),
			).rejects.toThrow(ORPCError)
		})

		it('should throw FORBIDDEN for itemUpdater', async () => {
			const itemUpdater = await createItemUpdater()

			await expect(
				call(exerciseRouter.getAll, undefined, {
					context: createTestContext(itemUpdater),
				}),
			).rejects.toThrow(ORPCError)
		})
	})

	describe('getAllOrg', () => {
		it('should return exercises for organisation', async () => {
			const user = await createRegularUser()
			const org = await createOrgFixture(user)
			const movement = await createMovementFixture()

			user.organisationId = org.id

			await createExerciseFixture({
				name: 'Org Exercise',
				organisationId: org.id,
				creatorId: user.id,
				movementId: movement.id,
			})

			const result = await call(
				exerciseRouter.getAllOrg,
				{ organisationId: org.id },
				{
					context: createTestContext(user),
				},
			)

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe('Org Exercise')
		})

		it('should return empty array for org with no exercises', async () => {
			const user = await createRegularUser()
			const org = await createOrgFixture(user)

			const result = await call(
				exerciseRouter.getAllOrg,
				{ organisationId: org.id },
				{
					context: createTestContext(user),
				},
			)

			expect(result).toHaveLength(0)
		})
	})

	describe('get', () => {
		it('should return exercise by id', async () => {
			const user = await createRegularUser()
			const org = await createOrgFixture(user)
			const movement = await createMovementFixture()
			const testExercise = await createExerciseFixture({
				name: 'Get Exercise',
				organisationId: org.id,
				creatorId: user.id,
				movementId: movement.id,
			})

			const result = await call(
				exerciseRouter.get,
				{ id: testExercise.id },
				{
					context: createTestContext(user),
				},
			)

			expect(result).not.toBeNull()
			expect(result?.name).toBe('Get Exercise')
			expect(result?.movement?.name).toBe(movement.name)
		})

		it('should return null for non-existent exercise', async () => {
			const user = await createRegularUser()

			const result = await call(
				exerciseRouter.get,
				{ id: 'non-existent-id' },
				{
					context: createTestContext(user),
				},
			)

			expect(result).toBeNull()
		})
	})

	describe('create', () => {
		it('should create exercise for itemUpdater', async () => {
			const itemUpdater = await createItemUpdater()
			const org = await createOrgFixture(itemUpdater)
			const movement = await createMovementFixture()

			itemUpdater.organisationId = org.id

			const result = await call(
				exerciseRouter.create,
				{
					name: 'New Exercise',
					movementId: movement.id,
					sets: 3,
					reps: 10,
					repUnit: 'reps',
				},
				{
					context: createTestContext(itemUpdater),
				},
			)

			expect(result.name).toBe('New Exercise')
			expect(result.sets).toBe(3)
			expect(result.creatorId).toBe(itemUpdater.id)
			expect(result.organisationId).toBe(org.id)
		})

		it('should create exercise for dictator', async () => {
			const dictator = await createDictator()
			const org = await createOrgFixture(dictator)
			const movement = await createMovementFixture()

			dictator.organisationId = org.id

			const result = await call(
				exerciseRouter.create,
				{
					name: 'Dictator Exercise',
					movementId: movement.id,
				},
				{
					context: createTestContext(dictator),
				},
			)

			expect(result.name).toBe('Dictator Exercise')
		})

		it('should throw FORBIDDEN for regular user', async () => {
			const user = await createRegularUser()
			const movement = await createMovementFixture()

			await expect(
				call(
					exerciseRouter.create,
					{
						name: 'Unauthorized Exercise',
						movementId: movement.id,
					},
					{
						context: createTestContext(user),
					},
				),
			).rejects.toThrow(ORPCError)
		})

		it('should throw BAD_REQUEST for user without organisation', async () => {
			const itemUpdater = await createItemUpdater()
			const movement = await createMovementFixture()

			await expect(
				call(
					exerciseRouter.create,
					{
						name: 'No Org Exercise',
						movementId: movement.id,
					},
					{
						context: createTestContext(itemUpdater),
					},
				),
			).rejects.toThrow(ORPCError)
		})
	})

	describe('update', () => {
		it('should update exercise for itemUpdater', async () => {
			const itemUpdater = await createItemUpdater()
			const org = await createOrgFixture(itemUpdater)
			const movement = await createMovementFixture()
			const testExercise = await createExerciseFixture({
				name: 'Original Name',
				organisationId: org.id,
				creatorId: itemUpdater.id,
				movementId: movement.id,
			})

			const result = await call(
				exerciseRouter.update,
				{
					id: testExercise.id,
					name: 'Updated Name',
					sets: 5,
				},
				{
					context: createTestContext(itemUpdater),
				},
			)

			expect(result.name).toBe('Updated Name')
			expect(result.sets).toBe(5)
		})

		it('should throw NOT_FOUND for non-existent exercise', async () => {
			const itemUpdater = await createItemUpdater()

			await expect(
				call(
					exerciseRouter.update,
					{
						id: 'non-existent-id',
						name: 'Updated Name',
					},
					{
						context: createTestContext(itemUpdater),
					},
				),
			).rejects.toThrow(ORPCError)
		})

		it('should throw FORBIDDEN for regular user', async () => {
			const user = await createRegularUser()
			const org = await createOrgFixture(user)
			const movement = await createMovementFixture()
			const testExercise = await createExerciseFixture({
				organisationId: org.id,
				movementId: movement.id,
			})

			await expect(
				call(
					exerciseRouter.update,
					{
						id: testExercise.id,
						name: 'Updated Name',
					},
					{
						context: createTestContext(user),
					},
				),
			).rejects.toThrow(ORPCError)
		})
	})

	describe('delete', () => {
		it('should delete exercise for itemUpdater', async () => {
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

			expect(result.success).toBe(true)
			expect(result.id).toBe(testExercise.id)
		})

		it('should throw FORBIDDEN for regular user', async () => {
			const user = await createRegularUser()
			const org = await createOrgFixture(user)
			const movement = await createMovementFixture()
			const testExercise = await createExerciseFixture({
				organisationId: org.id,
				movementId: movement.id,
			})

			await expect(
				call(
					exerciseRouter.delete,
					{ id: testExercise.id },
					{
						context: createTestContext(user),
					},
				),
			).rejects.toThrow(ORPCError)
		})
	})

	describe('addToSuperSet', () => {
		it('should add exercise to superset', async () => {
			const itemUpdater = await createItemUpdater()
			const org = await createOrgFixture(itemUpdater)
			const movement = await createMovementFixture()

			itemUpdater.organisationId = org.id

			const superSet = await createSuperSet(itemUpdater, org.id, {
				name: 'Super Set',
				movementId: movement.id,
			})

			const testExercise = await createExerciseFixture({
				name: 'Regular Exercise',
				organisationId: org.id,
				creatorId: itemUpdater.id,
				movementId: movement.id,
			})

			const result = await call(
				exerciseRouter.addToSuperSet,
				{
					superSetId: superSet.id,
					exerciseId: testExercise.id,
					order: 1,
				},
				{
					context: createTestContext(itemUpdater),
				},
			)

			expect(result.superSetId).toBe(superSet.id)
			expect(result.exerciseId).toBe(testExercise.id)
			expect(result.order).toBe(1)
		})

		it('should throw NOT_FOUND for non-existent superset', async () => {
			const itemUpdater = await createItemUpdater()

			await expect(
				call(
					exerciseRouter.addToSuperSet,
					{
						superSetId: 'non-existent-id',
						exerciseId: 'some-id',
					},
					{
						context: createTestContext(itemUpdater),
					},
				),
			).rejects.toThrow(ORPCError)
		})

		it('should throw BAD_REQUEST for non-superset exercise', async () => {
			const itemUpdater = await createItemUpdater()
			const org = await createOrgFixture(itemUpdater)
			const movement = await createMovementFixture()

			itemUpdater.organisationId = org.id

			const regularExercise = await createExerciseFixture({
				isSuperSet: false,
				organisationId: org.id,
				creatorId: itemUpdater.id,
				movementId: movement.id,
			})

			await expect(
				call(
					exerciseRouter.addToSuperSet,
					{
						superSetId: regularExercise.id,
						exerciseId: 'some-id',
					},
					{
						context: createTestContext(itemUpdater),
					},
				),
			).rejects.toThrow(ORPCError)
		})
	})

	describe('removeFromSuperSet', () => {
		it('should remove exercise from superset', async () => {
			const itemUpdater = await createItemUpdater()
			const org = await createOrgFixture(itemUpdater)
			const movement = await createMovementFixture()

			itemUpdater.organisationId = org.id

			const superSet = await createSuperSet(itemUpdater, org.id, {
				name: 'Super Set',
				movementId: movement.id,
			})

			const testExercise = await createExerciseFixture({
				name: 'Regular Exercise',
				organisationId: org.id,
				creatorId: itemUpdater.id,
				movementId: movement.id,
			})

			// First add to superset
			await call(
				exerciseRouter.addToSuperSet,
				{
					superSetId: superSet.id,
					exerciseId: testExercise.id,
				},
				{
					context: createTestContext(itemUpdater),
				},
			)

			// Then remove
			const result = await call(
				exerciseRouter.removeFromSuperSet,
				{
					superSetId: superSet.id,
					exerciseId: testExercise.id,
				},
				{
					context: createTestContext(itemUpdater),
				},
			)

			expect(result.success).toBe(true)
		})

		it('should throw FORBIDDEN for regular user', async () => {
			const user = await createRegularUser()

			await expect(
				call(
					exerciseRouter.removeFromSuperSet,
					{
						superSetId: 'some-id',
						exerciseId: 'some-id',
					},
					{
						context: createTestContext(user),
					},
				),
			).rejects.toThrow(ORPCError)
		})
	})

	describe('getSuperSetExercises', () => {
		it('should return exercises in superset ordered by order', async () => {
			const itemUpdater = await createItemUpdater()
			const org = await createOrgFixture(itemUpdater)
			const movement = await createMovementFixture()

			itemUpdater.organisationId = org.id

			const superSet = await createSuperSet(itemUpdater, org.id, {
				name: 'Super Set',
				movementId: movement.id,
			})

			const exercise1 = await createExerciseFixture({
				name: 'Exercise 1',
				organisationId: org.id,
				creatorId: itemUpdater.id,
				movementId: movement.id,
			})

			const exercise2 = await createExerciseFixture({
				name: 'Exercise 2',
				organisationId: org.id,
				creatorId: itemUpdater.id,
				movementId: movement.id,
			})

			// Add exercises with specific orders
			await call(
				exerciseRouter.addToSuperSet,
				{
					superSetId: superSet.id,
					exerciseId: exercise2.id,
					order: 2,
				},
				{
					context: createTestContext(itemUpdater),
				},
			)

			await call(
				exerciseRouter.addToSuperSet,
				{
					superSetId: superSet.id,
					exerciseId: exercise1.id,
					order: 1,
				},
				{
					context: createTestContext(itemUpdater),
				},
			)

			const result = await call(
				exerciseRouter.getSuperSetExercises,
				{ superSetId: superSet.id },
				{
					context: createTestContext(itemUpdater),
				},
			)

			expect(result).toHaveLength(2)
			expect(result[0].exercise.name).toBe('Exercise 1')
			expect(result[1].exercise.name).toBe('Exercise 2')
		})

		it('should return empty array for superset with no exercises', async () => {
			const user = await createRegularUser()
			const org = await createOrgFixture(user)
			const movement = await createMovementFixture()
			const superSet = await createSuperSet(user, org.id, {
				movementId: movement.id,
			})

			const result = await call(
				exerciseRouter.getSuperSetExercises,
				{ superSetId: superSet.id },
				{
					context: createTestContext(user),
				},
			)

			expect(result).toHaveLength(0)
		})
	})
})
