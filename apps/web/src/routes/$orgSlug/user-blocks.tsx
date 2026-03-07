import { UserBlocksPage } from '@/components/admin/user-blocks/user-blocks-page'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-blocks')({
	component: UserBlocksPageWrapper,
	ssr: false,
})

function UserBlocksPageWrapper() {
	const { orgSlug } = Route.useParams()
	return <UserBlocksPage orgSlug={orgSlug} />
}
