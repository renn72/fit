import { authClient } from '@/lib/auth-client'
import { queryClient } from '@/lib/orpc'

import { queryOptions } from '@tanstack/react-query'
import type { RegisteredRouter } from '@tanstack/react-router'

export type AppSession = {
	user?: {
		id?: string
		name?: string | null
		email?: string | null
		metaTags?: string | null
		organisationId?: string | null
		organisationSlug?: string | null
	} | null
} | null

export const sessionQueryOptions = queryOptions({
	queryKey: ['session'],
	queryFn: async () => {
		return (await authClient.getSession()) as AppSession
	},
	staleTime: 60_000,
})

export async function refreshSessionInRouter(router: RegisteredRouter) {
	await queryClient.fetchQuery({
		...sessionQueryOptions,
		staleTime: 0,
	})

	await router.invalidate({ sync: true })
}

export async function clearSessionInRouter(router: RegisteredRouter) {
	queryClient.removeQueries({ queryKey: sessionQueryOptions.queryKey })
	await router.invalidate({ sync: true })
}
