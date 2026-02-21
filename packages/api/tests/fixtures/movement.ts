import { movement } from '../../../db/src/schema/movement'
import type { MockUser } from '../helpers/auth'
import { getTestDB } from '../helpers/db'

export type MovementFixture = {
	id: string
	name: string
	force: string | null
	level: string | null
	mechanic: string | null
	equipment: string | null
	primaryMuscles: string | null
	secondaryMuscles: string | null
	instructions: string | null
	category: string | null
	images: string | null
	isBase: boolean
	baseId: string | null
	creatorId: string | null
	organisationId: string | null
	createdAt: Date
	updatedAt: Date
}

export async function createMovementFixture(
	data: Partial<MovementFixture> = {},
): Promise<MovementFixture> {
	const db = getTestDB()
	const now = new Date()
	const uniqueId = Date.now()

	const movementData = {
		id: data.id || `movement-${crypto.randomUUID()}`,
		name: data.name || `Test Movement ${uniqueId}`,
		force: data.force || null,
		level: data.level || null,
		mechanic: data.mechanic || null,
		equipment: data.equipment || null,
		primaryMuscles: data.primaryMuscles || null,
		secondaryMuscles: data.secondaryMuscles || null,
		instructions: data.instructions || null,
		category: data.category || null,
		images: data.images || null,
		isBase: data.isBase ?? false,
		baseId: data.baseId || null,
		creatorId: data.creatorId || null,
		organisationId: data.organisationId || null,
		createdAt: data.createdAt || now,
		updatedAt: data.updatedAt || now,
	}

	await db.insert(movement).values(movementData)

	return movementData
}

export async function createBaseMovement(
	data: Partial<MovementFixture> = {},
): Promise<MovementFixture> {
	return createMovementFixture({
		isBase: true,
		...data,
	})
}

export async function createOrgMovement(
	creator: MockUser,
	orgId: string,
	data: Partial<MovementFixture> = {},
): Promise<MovementFixture> {
	return createMovementFixture({
		isBase: false,
		creatorId: creator.id,
		organisationId: orgId,
		...data,
	})
}
