import { IngredientsTable } from '@/components/admin/ingredients-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/admin/s/ingredients')({
	component: IngredientsTable,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return <div>missing org</div>

		await context.queryClient.prefetchQuery(
			orpc.ingredient.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
