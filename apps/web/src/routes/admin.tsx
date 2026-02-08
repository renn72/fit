import { authClient } from '@/lib/auth-client'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
	component: RouteComponent,
})

function RouteComponent() {
	const { data: session } = authClient.useSession()

	return (
		<div>
			<pre>{JSON.stringify(session, null, 2)}</pre>
		</div>
	)
}
