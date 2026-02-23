import { MovementsPage } from '@/components/admin/movement/movements-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/movements')({
	component: MovementsPage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return <div>missing org</div>

		await context.queryClient.prefetchQuery(
			orpc.movement.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
