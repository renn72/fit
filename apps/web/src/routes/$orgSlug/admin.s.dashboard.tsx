import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/admin/s/dashboard')({
	component: RouteComponent,
})

function RouteComponent() {
	const { orgSlug } = Route.useParams()
	return <div>Hello "/admin/{orgSlug}/dashboard"!</div>
}
