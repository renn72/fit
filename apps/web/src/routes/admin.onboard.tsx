import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/onboard')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/admin/onbard"!</div>
}
