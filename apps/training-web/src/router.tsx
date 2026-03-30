import { orpc, queryClient } from '@/lib/orpc'
import { routeTree } from '@/routeTree.gen'

import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { orpc, queryClient },
		defaultPendingComponent: () => (
			<div className='flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground'>
				Loading training workspace...
			</div>
		),
		defaultNotFoundComponent: () => (
			<div className='flex min-h-screen items-center justify-center bg-background px-6 text-center'>
				<div className='space-y-2'>
					<p className='text-sm uppercase tracking-[0.24em] text-muted-foreground'>
						Not found
					</p>
					<h1 className='text-2xl font-semibold'>
						This training page does not exist.
					</h1>
				</div>
			</div>
		),
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	})

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
