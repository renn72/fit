import { ThemeProvider, useTheme } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getUserQuery } from '@/functions/get-user'
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

import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import appCss from '../index.css?url'
export interface RouterAppContext {
	orpc: typeof orpc
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData({
			...getUserQuery,
			revalidateIfStale: true,
		})
		return { session }
	},
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
			{
				rel: 'apple-touch-icon',
				sizes: '180x180',
				href: '/apple-touch-icon.png',
			},
			{
				rel: 'icon',
				type: 'image/png',
				sizes: '32x32',
				href: '/favicon-32x32.png',
			},
			{
				rel: 'icon',
				type: 'image/png',
				sizes: '16x16',
				href: '/favicon-16x16.png',
			},
			{ rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
			{ rel: 'icon', href: '/favicon.ico' },
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
		<html
			suppressHydrationWarning
			lang='en'
			className={theme === 'system' ? '' : theme}
		>
			<head>
				<HeadContent />
			</head>
			<body>
				<NuqsAdapter>
					<TooltipProvider>
						<div className='grid h-svh grid-rows-[auto_1fr]'>
							<Outlet />
						</div>
					</TooltipProvider>
				</NuqsAdapter>
				<Toaster richColors />
				<TanStackRouterDevtools position='bottom-left' />
				<ReactQueryDevtools position='bottom' buttonPosition='bottom-right' />
				<Scripts />
			</body>
		</html>
	)
}
