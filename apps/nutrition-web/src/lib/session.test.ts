import { beforeEach, describe, expect, test, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({
	getSession: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
	authClient: {
		getSession,
	},
}))

vi.mock('@/lib/orpc', () => ({
	queryClient: {
		fetchQuery: vi.fn(),
		removeQueries: vi.fn(),
	},
}))

import { sessionQueryOptions } from './session'

describe('nutrition session query', () => {
	beforeEach(() => {
		getSession.mockReset()
	})

	test('unwraps the Better Auth data envelope into route session context', async () => {
		const response = {
			data: {
				user: {
					id: 'user-1',
					email: 'casey@example.com',
				},
				session: {
					id: 'session-1',
				},
			},
			error: null,
		}

		getSession.mockResolvedValue(response)

		const queryFn = sessionQueryOptions.queryFn as () => Promise<unknown>

		await expect(queryFn()).resolves.toEqual(response.data)
	})
})
