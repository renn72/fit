import { getAdminRedirectTarget } from '@/lib/auth-routing'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
	component: RouteComponent,
	loader: async ({ context }) => {
		throw redirect(getAdminRedirectTarget(context.session))
	},
})

function RouteComponent() {
	return <div>Hello "/admin"!</div>
}
