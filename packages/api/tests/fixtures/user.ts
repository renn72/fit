import { user, userToggles } from '../../../db/src/schema/auth'
import type { MockUser } from '../helpers/auth'
import { getTestDB } from '../helpers/db'

export async function createUserFixture(
	data: Partial<MockUser> = {},
): Promise<MockUser> {
	const db = getTestDB()
	const now = new Date()

	const userData = {
		id: data.id || `user-${crypto.randomUUID()}`,
		name: data.name || 'Test User',
		email: data.email || `test-${Date.now()}@example.com`,
		emailVerified: data.emailVerified ?? true,
		metaTags: data.metaTags || '',
		organisationId: data.organisationId || null,
		organisationSlug: data.organisationSlug || null,
		organisationCreatorId: data.organisationCreatorId || null,
		role: data.role || null,
		image: data.image || null,
		banned: data.banned || null,
		banReason: data.banReason || null,
		banExpires: data.banExpires || null,
		createdAt: data.createdAt || now,
		updatedAt: data.updatedAt || now,
	}

	await db.insert(user).values(userData)

	// Create user toggles
	await db.insert(userToggles).values({
		id: `toggle-${crypto.randomUUID()}`,
		userId: userData.id,
		isRoot: false,
		isCreator: false,
		isTrainer: false,
		isClient: false,
		isActive: true,
		createdAt: now,
		updatedAt: now,
	})

	return userData
}

export async function createRegularUser(
	data: Partial<MockUser> = {},
): Promise<MockUser> {
	return createUserFixture({
		metaTags: '',
		...data,
	})
}

export async function createItemUpdater(
	data: Partial<MockUser> = {},
): Promise<MockUser> {
	return createUserFixture({
		metaTags: 'itemUpdater',
		...data,
	})
}

export async function createDictator(
	data: Partial<MockUser> = {},
): Promise<MockUser> {
	return createUserFixture({
		metaTags: 'dictator',
		...data,
	})
}
