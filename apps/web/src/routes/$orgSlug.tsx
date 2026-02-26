import { AppSidebar } from '@/components/admin-sidebar/app-sidebar'
import { SidebarHeader } from '@/components/admin-sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import {
	createFileRoute,
	Outlet,
	redirect,
	retainSearchParams,
	useLocation,
} from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'

import { z } from 'zod'

const orgSearchSchema = z.object({
	user: z.string().optional(),
})

export const Route = createFileRoute('/$orgSlug')({
	validateSearch: zodValidator(orgSearchSchema),
	search: {
		middlewares: [retainSearchParams(['user'])],
	},
	loader: async ({ context }) => {
		const session = context.session

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
	const { user } = Route.useSearch()
	const navigate = Route.useNavigate()

	// Default to current user's ID if no userId in search params
	const selectedUserId = user || null
	const location = useLocation()
	const handleUserSelect = (newUserId: string) => {
		navigate({
			to: location.pathname,
			search: (prev: { user?: string }) => ({ ...prev, user: newUserId }),
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
