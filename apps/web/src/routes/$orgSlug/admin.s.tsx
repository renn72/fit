import { AppSidebar } from '@/components/admin-sidebar/app-sidebar'
import { SidebarHeader } from '@/components/admin-sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/admin/s')({
	component: LayoutRouteComponent,
})

function LayoutRouteComponent() {
	return (
		<div className='[--header-height:calc(--spacing(14))]'>
			<SidebarProvider className='flex flex-col'>
				<SidebarHeader />
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
