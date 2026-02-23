import { WarmupsPage } from '@/components/admin/warmup/warmups-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/warmups')({
	component: WarmupsPage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return

		await context.queryClient.prefetchQuery(
			orpc.warmup.getAllGroups.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
