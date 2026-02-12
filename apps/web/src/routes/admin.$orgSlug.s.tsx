import { AppSidebar } from '@/components/admin-sidebar/app-sidebar'
import { SidebarHeader } from '@/components/admin-sidebar/sidebar-header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgSlug/s')({
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
						<ScrollArea className='h-[calc(100svh-60px)]'>
							hi
							<div className='h-screen' />
							<Outlet />
							hi
						</ScrollArea>
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	)
}
