import { organisation } from '../../../db/src/schema/org'
import type { MockUser } from '../helpers/auth'
import { getTestDB } from '../helpers/db'

export type OrgFixture = {
	id: string
	name: string
	slug: string
	timezone: string
	state: string
	creatorId: string | null
	createdAt: Date
	updatedAt: Date
}

export async function createOrgFixture(
	creator: MockUser,
	data: Partial<OrgFixture> = {},
): Promise<OrgFixture> {
	const db = getTestDB()
	const now = new Date()
	const uniqueId = Date.now()

	const orgData = {
		id: data.id || `org-${crypto.randomUUID()}`,
		name: data.name || `Test Organisation ${uniqueId}`,
		slug: data.slug || `test-org-${uniqueId}`,
		timezone: data.timezone || 'UTC',
		state: data.state || 'active',
		creatorId: creator.id,
		createdAt: data.createdAt || now,
		updatedAt: data.updatedAt || now,
	}

	await db.insert(organisation).values(orgData)

	return orgData
}
