import { ThemeProvider, useTheme } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { orpc } from '@/utils/orpc'

import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import appCss from '../index.css?url'
export interface RouterAppContext {
	orpc: typeof orpc
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'Fit wsys',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),

	component: RootComponent,
})
function RootComponent() {
	return (
		// TODO fix ssr hydration shit
		<ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
			<InnerRoot />
		</ThemeProvider>
	)
}

function InnerRoot() {
	// Now we can safely use useTheme because we are inside the Provider
	const { theme } = useTheme()

	return (
		<html lang='en' className={theme === 'system' ? '' : theme}>
			<head>
				<HeadContent />
			</head>
			<body>
				<TooltipProvider>
					<div className='grid h-svh grid-rows-[auto_1fr]'>
						<Outlet />
					</div>
					<Toaster richColors />
					<TanStackRouterDevtools position='bottom-left' />
					<ReactQueryDevtools position='bottom' buttonPosition='bottom-right' />
					<Scripts />
				</TooltipProvider>
			</body>
		</html>
	)
}
