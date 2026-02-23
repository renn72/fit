import { BaseIngredientsTable } from '@/components/dictator/orgs/base-ingredients-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/base-ingredients')({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.ingredient.getAllBase.queryOptions({ input: {} }),
		)
	},
	ssr: false,
	component: BaseIngredientsTable,
})
