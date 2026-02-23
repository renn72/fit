import { MenuTemplatesPage } from '@/components/admin/menu-template/menu-templates-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/menu-templates')({
	component: MenuTemplatesPage,
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
