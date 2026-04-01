import type { ComponentProps } from 'react'

import { AppShell } from './app-shell'
import { ThemeProvider } from './theme-provider'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/auth-client', () => ({
	authClient: {
		signOut: vi.fn(),
	},
}))

vi.mock('@tanstack/react-router', async () => {
	const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
		'@tanstack/react-router',
	)

	return {
		...actual,
		Link: ({
			children,
			activeProps: _activeProps,
			inactiveProps: _inactiveProps,
			...props
		}: ComponentProps<'a'> & {
			activeProps?: unknown
			inactiveProps?: unknown
		}) => <a {...props}>{children}</a>,
		useRouter: () => ({
			invalidate: vi.fn(),
			navigate: vi.fn(),
		}),
	}
})

describe('training app shell', () => {
	test('matches the new quick-access header and centered dock layout', () => {
		render(
			<ThemeProvider storageKey='training-web-theme-test'>
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
			</ThemeProvider>,
		)

		expect(screen.getByLabelText(/open training plan/i)).toBeTruthy()
		expect(screen.getByLabelText(/open training recovery/i)).toBeTruthy()
		expect(
			screen.getByRole('button', { name: /account/i }).textContent,
		).toContain('CC')
		expect(
			screen.queryByText(/sticky dock for quick mobile navigation/i),
		).toBeNull()
		expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull()
		expect(screen.getByText(/Forma \| Training/i)).toBeTruthy()
	})

	test('opens the account dropdown without crashing', async () => {
		render(
			<ThemeProvider storageKey='training-web-theme-test'>
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
			</ThemeProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: /account/i }))

		const accountTrigger = screen.getByRole('button', { name: /account/i })
		const dropdownContent = screen
			.getByText('casey@example.com')
			.closest('[data-slot="dropdown-menu-content"]')

		expect(screen.getByText('casey@example.com')).toBeTruthy()
		expect(screen.getByText(/profile/i)).toBeTruthy()
		expect(accountTrigger.className).not.toContain('shadow-[')
		expect(accountTrigger.className).not.toContain('bg-foreground')
		expect(dropdownContent?.className).not.toContain('w-60')
	})

	test('uses a single dark theme toggle in the account dropdown', async () => {
		render(
			<ThemeProvider storageKey='training-web-theme-toggle-test'>
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
			</ThemeProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: /account/i }))

		const darkThemeToggle = screen.getByRole('menuitemcheckbox', {
			name: /dark theme/i,
		})

		expect(screen.queryByRole('menuitem', { name: /light theme/i })).toBeNull()
		expect(darkThemeToggle).toHaveAttribute('aria-checked', 'true')

		fireEvent.click(darkThemeToggle)

		await waitFor(() => {
			expect(document.documentElement.classList.contains('light')).toBe(true)
		})

		fireEvent.click(screen.getByRole('button', { name: /account/i }))
		expect(
			screen.getByRole('menuitemcheckbox', { name: /dark theme/i }),
		).toHaveAttribute('aria-checked', 'false')
	})
})
