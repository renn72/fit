import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AuthPanel } from './auth-panel'

const navigate = vi.fn()

vi.mock('@/lib/auth-client', () => ({
	authClient: {
		signIn: { email: vi.fn() },
		signUp: { email: vi.fn() },
	},
}))

vi.mock('@/lib/session', () => ({
	refreshSessionInRouter: vi.fn(),
}))

vi.mock('@tanstack/react-router', async () => {
	const actual =
		await vi.importActual<typeof import('@tanstack/react-router')>(
			'@tanstack/react-router'
		)

	return {
		...actual,
		useRouter: () => ({ navigate }),
	}
})

describe('nutrition auth panel', () => {
	beforeEach(() => {
		navigate.mockReset()
	})

	test('keeps account creation off the client surface', () => {
		render(<AuthPanel />)

		expect(screen.queryByText(/create account/i)).toBeNull()
		expect(screen.getByText(/admin creates/i)).toBeTruthy()
		expect(screen.getByText(/Forma \| Nutrition/i)).toBeTruthy()
	})
})
