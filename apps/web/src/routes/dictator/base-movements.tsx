import { BaseMovementsTable } from '@/components/dictator/orgs/base-movements-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/base-movements')({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.movement.getAllBase.queryOptions({ input: {} }),
		)
	},
	ssr: false,
	component: BaseMovementsTable,
})
