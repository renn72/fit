import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
	component: RouteComponent,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgSlug = session?.user?.organisationSlug
		if (!userOrgSlug) {
			throw redirect({
				to: '/',
			})
		}
		if (!session?.user?.organisationId) {
			throw redirect({
				to: '/',
			})
		}
		throw redirect({
			to: '/$orgSlug',
			params: { orgSlug: userOrgSlug },
		})
	},
})

function RouteComponent() {
	return <div>Hello "/admin"!</div>
}
