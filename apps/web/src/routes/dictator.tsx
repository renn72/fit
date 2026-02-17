import { DictatorSidebar } from '@/components/dictator-sidebar/app-sidebar'
import { DictatorSidebarHeader } from '@/components/dictator-sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator')({
	component: LayoutRouteComponent,
	loader: async ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: '/login',
			})
		}

		const metaTags = context.session.user.metaTags?.split(',') ?? []
		if (!metaTags.includes('dictator')) {
			throw redirect({
				to: '/',
			})
		}
	},
})

function LayoutRouteComponent() {
	const { session } = Route.useRouteContext()
	return (
		<div className='[--header-height:calc(--spacing(14))]'>
			<SidebarProvider className='flex flex-col'>
				<DictatorSidebarHeader session={session} />
				<div className='flex flex-1'>
					<DictatorSidebar />
					<SidebarInset>
						<div className='flex overflow-auto flex-col flex-1 p-4'>
							<Outlet />
						</div>
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	)
}
