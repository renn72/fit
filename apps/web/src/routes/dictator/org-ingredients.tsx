import { OrgIngredientsTable } from '@/components/dictator/orgs/org-ingredients-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/org-ingredients')({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.ingredient.getAll.queryOptions({ input: {} }),
		)
	},
	ssr: false,
	component: OrgIngredientsTable,
})
