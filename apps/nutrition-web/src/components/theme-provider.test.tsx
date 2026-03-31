import { ThemeProvider } from './theme-provider'

import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

describe('nutrition theme provider', () => {
	beforeEach(() => {
		localStorage.clear()
		document.documentElement.className = ''
	})

	afterEach(() => {
		document.documentElement.className = ''
	})

	test('defaults the app to dark mode when no preference is stored', async () => {
		render(
			<ThemeProvider storageKey='nutrition-web-theme-test'>
				<div>Nutrition</div>
			</ThemeProvider>,
		)

		await waitFor(() => {
			expect(document.documentElement.classList.contains('dark')).toBe(true)
		})
	})
})
