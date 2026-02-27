import { UserMenuEditPage } from '@/components/admin/user-menu-create/user-menu-edit'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-menu-edit/$menuId')({
	component: UserMenuEditPage,
	loader: async ({ context, params }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId
		const { menuId } = params

		if (!userOrgId || !menuId) return

		// Prefetch the existing menu data for editing
		await context.queryClient.prefetchQuery(
			orpc.userMenu.get.queryOptions({
				input: { id: menuId },
			}),
		)

		// Also prefetch menu templates (for potential re-templating)
		await context.queryClient.prefetchQuery(
			orpc.menuTemplate.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
