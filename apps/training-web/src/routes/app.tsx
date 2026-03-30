import { AppShell } from '@/components/app-shell'
import { DashboardOverview } from '@/components/dashboard-overview'

import {
	createFileRoute,
	Outlet,
	redirect,
	useLocation,
} from '@tanstack/react-router'

export const Route = createFileRoute('/app')({
	beforeLoad: ({ context }) => {
		if (!context.session?.user) {
			throw redirect({ to: '/auth' })
		}
	},
	component: TrainingAppRoute,
})

function TrainingAppRoute() {
	const { session } = Route.useRouteContext()
	const location = useLocation()
	const isIndexRoute =
		location.pathname === '/app' || location.pathname === '/app/'

	return (
		<AppShell session={session}>
			{isIndexRoute ? <DashboardOverview /> : <Outlet />}
		</AppShell>
	)
}
