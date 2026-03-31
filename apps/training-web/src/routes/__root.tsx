import { Toaster } from '@fit/components/ui/sonner'
import { TooltipProvider } from '@fit/components/ui/tooltip'

import { ThemeProvider } from '@/components/theme-provider'
import type { orpc } from '@/lib/orpc'
import { sessionQueryOptions } from '@/lib/session'

import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

export interface RouterAppContext {
	orpc: typeof orpc
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	beforeLoad: async ({ context }) => {
		const session =
			await context.queryClient.ensureQueryData(sessionQueryOptions)
		return { session }
	},
	component: RootComponent,
})

function RootComponent() {
	return (
		<ThemeProvider storageKey='training-web-theme'>
			<TooltipProvider>
				<div className='min-h-screen text-foreground'>
					<Outlet />
				</div>
			</TooltipProvider>
			<Toaster richColors />
		</ThemeProvider>
	)
}
