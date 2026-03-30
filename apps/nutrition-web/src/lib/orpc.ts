import type { AppRouter } from '@fit/api/routers/index'
import { env } from '@fit/env/web'

import { QueryCache, QueryClient } from '@tanstack/react-query'

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { toast } from 'sonner'

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(`Request failed: ${error.message}`, {
				action: {
					label: 'Retry',
					onClick: query.invalidate,
				},
			})
		},
	}),
})

const link = new RPCLink({
	url: `${env.VITE_SERVER_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: 'include',
		})
	},
})

const getORPCClient = () => createORPCClient(link) as RouterClient<AppRouter>

export const client: RouterClient<AppRouter> = getORPCClient()
export const orpc = createTanstackQueryUtils(client)
