import { Route } from './index'

import { describe, expect, test } from 'vitest'

function getBeforeLoadSource() {
	const beforeLoad = Route.options.beforeLoad

	expect(typeof beforeLoad).toBe('function')
	return String(beforeLoad)
}

describe('training root route', () => {
	test('redirects signed-out users to the auth screen', () => {
		expect(getBeforeLoadSource()).toContain('/auth')
	})

	test('redirects signed-in users to the app shell', () => {
		expect(getBeforeLoadSource()).toContain('/app')
	})
})
