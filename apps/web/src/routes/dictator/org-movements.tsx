import { OrgMovementsTable } from '@/components/dictator/orgs/org-movements-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/org-movements')({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.movement.getAll.queryOptions({ input: {} }),
		)
	},
	ssr: false,
	component: OrgMovementsTable,
})
