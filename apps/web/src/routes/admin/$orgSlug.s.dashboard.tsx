import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/$orgSlug/s/dashboard')({
	component: RouteComponent,
})

function RouteComponent() {
	const { orgSlug } = Route.useParams()
	return <div>Hello sjkd "/admin/{orgSlug}/dashboard"!</div>
}
