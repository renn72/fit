import { authClient } from '@/lib/auth-client'
import { queryClient } from '@/lib/orpc'

import { queryOptions } from '@tanstack/react-query'
import type { RegisteredRouter } from '@tanstack/react-router'

type AuthSession = typeof authClient.$Infer.Session

export type AppSession = {
	user?: Partial<AuthSession['user']> | null
	session?: Partial<AuthSession['session']> | null
} | null

type SessionQueryResult = Awaited<ReturnType<typeof authClient.getSession>>

function extractSession(result: SessionQueryResult): AppSession {
	if (result && typeof result === 'object' && 'data' in result) {
		return (result.data ?? null) as AppSession
	}

	return (result ?? null) as AppSession
}

export const sessionQueryOptions = queryOptions({
	queryKey: ['session'],
	queryFn: async () => {
		return extractSession(await authClient.getSession())
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
