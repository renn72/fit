import { AppSidebar } from '@/components/admin-sidebar/app-sidebar'
import { SidebarHeader } from '@/components/admin-sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug')({
	loader: async ({ context, params }) => {
		const { orgSlug } = params
		const session = context.session
		const userOrgSlug = session?.user?.organisationSlug

		if (userOrgSlug !== orgSlug) {
			throw redirect({
				to: '/',
			})
		}
		if (!session?.user?.organisationId) {
			throw redirect({
				to: '/',
			})
		}
	},
	component: LayoutRouteComponent,
})

function LayoutRouteComponent() {
	const { session } = Route.useRouteContext()
	console.log('base layout route component')
	return (
		<div className='[--header-height:calc(--spacing(14))]'>
			<SidebarProvider className='flex flex-col'>
				<SidebarHeader session={session} />
				<div className='flex flex-1'>
					<AppSidebar />
					<SidebarInset>
						<Outlet />
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	)
}
