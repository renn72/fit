import type { MovementFixture } from './movement'

import { exercise } from '../../../db/src/schema/exercise'
import type { MockUser } from '../helpers/auth'
import { getTestDB } from '../helpers/db'

export type ExerciseFixture = {
	id: string
	name: string
	movementId: string | null
	sets: number | null
	reps: number | null
	repUnit: string | null
	ormPercent: number | null
	targetRpe: number | null
	restTime: number | null
	restUnit: string | null
	tempoDown: number | null
	tempoPause: number | null
	tempoUp: number | null
	notes: string | null
	isSuperSet: boolean
	creatorId: string | null
	organisationId: string | null
	createdAt: Date
	updatedAt: Date
}

export async function createExerciseFixture(
	data: Partial<ExerciseFixture> = {},
): Promise<ExerciseFixture> {
	const db = getTestDB()
	const now = new Date()
	const uniqueId = Date.now()

	const exerciseData = {
		id: data.id || `exercise-${crypto.randomUUID()}`,
		name: data.name || `Test Exercise ${uniqueId}`,
		movementId: data.movementId || null,
		sets: data.sets ?? null,
		reps: data.reps ?? null,
		repUnit: data.repUnit || null,
		ormPercent: data.ormPercent ?? null,
		targetRpe: data.targetRpe ?? null,
		restTime: data.restTime ?? null,
		restUnit: data.restUnit || null,
		tempoDown: data.tempoDown ?? null,
		tempoPause: data.tempoPause ?? null,
		tempoUp: data.tempoUp ?? null,
		notes: data.notes || null,
		isSuperSet: data.isSuperSet ?? false,
		creatorId: data.creatorId || null,
		organisationId: data.organisationId || null,
		createdAt: data.createdAt || now,
		updatedAt: data.updatedAt || now,
	}

	await db.insert(exercise).values(exerciseData)

	return exerciseData
}

export async function createExerciseWithMovement(
	creator: MockUser,
	orgId: string,
	movement: MovementFixture,
	data: Partial<ExerciseFixture> = {},
): Promise<ExerciseFixture> {
	return createExerciseFixture({
		movementId: movement.id,
		creatorId: creator.id,
		organisationId: orgId,
		...data,
	})
}

export async function createSuperSet(
	creator: MockUser,
	orgId: string,
	data: Partial<ExerciseFixture> = {},
): Promise<ExerciseFixture> {
	return createExerciseFixture({
		isSuperSet: true,
		creatorId: creator.id,
		organisationId: orgId,
		...data,
	})
}
