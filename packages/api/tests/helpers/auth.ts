export type MockUser = {
	id: string
	name: string
	email: string
	emailVerified: boolean
	metaTags: string
	organisationId: string | null
	organisationSlug: string | null
	organisationCreatorId: string | null
	role: string | null
	image: string | null
	banned: boolean | null
	banReason: string | null
	banExpires: Date | null
	createdAt: Date
	updatedAt: Date
}

export type TestContext = {
	session: {
		user: MockUser
	} | null
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
	const now = new Date()
	return {
		id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
		name: 'Test User',
		email: `test-${Date.now()}@example.com`,
		emailVerified: true,
		metaTags: '',
		organisationId: null,
		organisationSlug: null,
		organisationCreatorId: null,
		role: null,
		image: null,
		banned: null,
		banReason: null,
		banExpires: null,
		createdAt: now,
		updatedAt: now,
		...overrides,
	}
}

export function createRegularUser(overrides: Partial<MockUser> = {}): MockUser {
	return createMockUser({
		metaTags: '',
		...overrides,
	})
}

export function createItemUpdater(overrides: Partial<MockUser> = {}): MockUser {
	return createMockUser({
		metaTags: 'itemUpdater',
		...overrides,
	})
}

export function createDictator(overrides: Partial<MockUser> = {}): MockUser {
	return createMockUser({
		metaTags: 'dictator',
		...overrides,
	})
}

export function createTestContext(user: MockUser | null = null): TestContext {
	return {
		session: user ? { user } : null,
	}
}

// Permission check helpers
export function hasItemUpdaterAccess(metaTags: string): boolean {
	const tags = metaTags.split(',').map((t) => t.trim())
	return tags.includes('itemUpdater') || tags.includes('dictator')
}

export function hasDictatorAccess(metaTags: string): boolean {
	const tags = metaTags.split(',').map((t) => t.trim())
	return tags.includes('dictator')
}
