import { PlansTable } from '@/components/dictator/plans/plans-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/plans')({
	component: PlansTable,
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.organisation.getAllPlansAdmin.queryOptions({}),
		)
	},
	ssr: false,
})
