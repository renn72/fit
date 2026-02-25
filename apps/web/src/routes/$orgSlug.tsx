import { AppSidebar } from '@/components/admin-sidebar/app-sidebar'
import { SidebarHeader } from '@/components/admin-sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'

import { z } from 'zod'

const orgSearchSchema = z.object({
	userId: z.string().optional(),
})

export const Route = createFileRoute('/$orgSlug')({
	validateSearch: zodValidator(orgSearchSchema),
	loader: async ({ context, params }) => {
		const { orgSlug } = params
		const session = context.session
		const userOrgSlug = session?.user?.organisationSlug

		if (userOrgSlug !== orgSlug) {
			console.log('redirecting')
			throw redirect({
				to: '/',
			})
		}
		if (!session?.user?.organisationId) {
			console.log('redirecting')
			throw redirect({
				to: '/',
			})
		}
	},
	component: LayoutRouteComponent,
})

function LayoutRouteComponent() {
	const { session } = Route.useRouteContext()
	const { userId } = Route.useSearch()
	const navigate = Route.useNavigate()

	// Default to current user's ID if no userId in search params
	const selectedUserId = userId || session.user.id

	const handleUserSelect = (newUserId: string) => {
		navigate({
			search: (prev: { userId?: string }) => ({ ...prev, userId: newUserId }),
			replace: true,
		})
	}

	return (
		<div className='[--header-height:calc(--spacing(14))]'>
			<SidebarProvider className='flex flex-col'>
				<SidebarHeader session={session} />
				<div className='flex flex-1'>
					<AppSidebar
						selectedUserId={selectedUserId}
						onUserSelect={handleUserSelect}
					/>
					<SidebarInset>
						<Outlet />
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	)
}
