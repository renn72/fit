import { BlockTemplatesPage } from '@/components/admin/block-template/block-templates-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/block-templates')({
	component: BlockTemplatesPage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return

		await context.queryClient.prefetchQuery(
			orpc.blockTemplate.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
