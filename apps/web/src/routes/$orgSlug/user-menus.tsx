import { UserMenusPage } from '@/components/admin/user-menus/user-menus-page'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-menus')({
	component: UserMenusPageWrapper,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return
	},
	ssr: false,
})

function UserMenusPageWrapper() {
	const { orgSlug } = Route.useParams()
	return <UserMenusPage orgSlug={orgSlug} />
}
