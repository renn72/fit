import { getUserQuery } from '@/functions/get-user'
import { queryClient } from '@/utils/orpc'

import type { RegisteredRouter } from '@tanstack/react-router'

export async function refreshSessionInRouter(router: RegisteredRouter) {
	await queryClient.fetchQuery({
		...getUserQuery,
		staleTime: 0,
	})

	await router.invalidate({ sync: true })
}

export async function clearSessionInRouter(router: RegisteredRouter) {
	queryClient.removeQueries({ queryKey: getUserQuery.queryKey })
	await router.invalidate({ sync: true })
}
