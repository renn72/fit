import { OrgIngredientsTable } from '@/components/dictator/org-ingredients-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/org-ingredients')({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			orpc.ingredient.getAll.queryOptions({ input: {} }),
		)
	},
	ssr: 'data-only',
	component: OrgIngredientsTable,
})
