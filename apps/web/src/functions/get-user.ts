import { authMiddleware } from '@/middleware/auth'

import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

export const getUser = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return context.session
	})

export const getUserQuery = queryOptions({
	queryKey: ['session'],
	queryFn: async () => await getUser(),
	staleTime: 1 * 60 * 1000,
})
