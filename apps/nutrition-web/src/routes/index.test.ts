import { describe, expect, test } from 'vitest'

import { Route } from './index'

function getRedirectTarget(session: { user?: object | null } | null) {
	const beforeLoad = Route.options.beforeLoad

	expect(typeof beforeLoad).toBe('function')

	try {
		beforeLoad?.({ context: { session } } as never)
		return null
	} catch (error) {
		return (
			(error as { to?: string }).to ??
			(error as { href?: string }).href ??
			null
		)
	}
}

describe('nutrition root route', () => {
	test('redirects signed-out users to the auth screen', () => {
		expect(getRedirectTarget(null)).toBe('/auth')
	})

	test('redirects signed-in users to the app shell', () => {
		expect(getRedirectTarget({ user: { id: 'user-1' } })).toBe('/app')
	})
})
