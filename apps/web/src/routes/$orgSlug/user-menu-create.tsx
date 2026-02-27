import { UserMenuCreatePage } from '@/components/admin/user-menu-create/user-menu-create'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-menu-create')({
	component: UserMenuCreatePage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return

		await context.queryClient.prefetchQuery(
			orpc.menuTemplate.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
