import { OrgsTable } from '@/components/dictator/orgs-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/orgs')({
	component: OrgsTable,
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.organisation.getAll.queryOptions({}),
		)
	},
	ssr: false,
})
