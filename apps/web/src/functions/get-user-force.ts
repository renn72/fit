import { authRefreshMiddleware } from '@/middleware/auth'

import { createServerFn } from '@tanstack/react-start'

export const getUserForce = createServerFn({ method: 'GET' })
	.middleware([authRefreshMiddleware])
	.handler(async ({ context }) => {
		return context.session
	})
