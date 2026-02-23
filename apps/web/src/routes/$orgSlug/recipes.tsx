import { RecipesPage } from '@/components/admin/recipe/recipes-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/recipes')({
	component: RecipesPage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return <div>missing org</div>

		await context.queryClient.prefetchQuery(
			orpc.recipe.getOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
