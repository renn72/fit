import { DictatorSidebar } from '@/components/dictator-sidebar/app-sidebar'
import { DictatorSidebarHeader } from '@/components/dictator-sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getUser } from '@/functions/get-user'

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator')({
	component: LayoutRouteComponent,
	beforeLoad: async () => {
		const session = await getUser()
		return { session }
	},
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
	return (
		<div className='[--header-height:calc(--spacing(14))]'>
			<SidebarProvider className='flex flex-col'>
				<DictatorSidebarHeader />
				<div className='flex flex-1'>
					<DictatorSidebar />
					<SidebarInset>
						<div className='flex flex-col flex-1 p-4 overflow-auto'>
							<Outlet />
						</div>
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	)
}
