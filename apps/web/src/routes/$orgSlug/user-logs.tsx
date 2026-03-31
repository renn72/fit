import { UserLogsPage } from '@/components/admin/user-logs/user-logs-page'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-logs')({
	component: UserLogsPageWrapper,
	ssr: false,
})

function UserLogsPageWrapper() {
	const { orgSlug } = Route.useParams()
	return <UserLogsPage orgSlug={orgSlug} />
}
