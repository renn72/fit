import type { ComponentProps } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { AppShell } from './app-shell'
import { ThemeProvider } from './theme-provider'

vi.mock('@/lib/auth-client', () => ({
	authClient: {
		signOut: vi.fn(),
	},
}))

vi.mock('@tanstack/react-router', async () => {
	const actual =
		await vi.importActual<typeof import('@tanstack/react-router')>(
			'@tanstack/react-router'
		)

	return {
		...actual,
		Link: ({ children, ...props }: ComponentProps<'a'>) => (
			<a {...props}>{children}</a>
		),
		useRouter: () => ({
			invalidate: vi.fn(),
			navigate: vi.fn(),
		}),
	}
})

describe('nutrition app shell', () => {
	test('exposes a dedicated account button in the mobile dock', () => {
		render(
			<ThemeProvider storageKey='nutrition-web-theme-test'>
				<AppShell
					session={{
						user: {
							id: 'user-1',
							name: 'Casey Client',
							email: 'casey@example.com',
						},
					}}
				>
					<div>Body</div>
				</AppShell>
			</ThemeProvider>
		)

		expect(screen.getByRole('button', { name: /account/i })).toBeTruthy()
		expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull()
		expect(screen.getByText(/Forma \| Nutrition/i)).toBeTruthy()
	})
})
