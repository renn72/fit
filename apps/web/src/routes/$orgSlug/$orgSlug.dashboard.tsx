import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/$orgSlug/dashboard')({
	component: RouteComponent,
})

function RouteComponent() {
	const { orgSlug } = Route.useParams()
	return <div>Hello "/{orgSlug}/dashboard"!</div>
}
