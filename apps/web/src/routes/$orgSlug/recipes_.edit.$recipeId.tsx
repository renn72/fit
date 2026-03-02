import { RecipeEditForm } from '@/components/admin/recipe/recipe-edit-form'
import { orpc } from '@/utils/orpc'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/recipes_/edit/$recipeId')({
	component: EditRecipePage,
	loader: async ({ context, params }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId
		const { recipeId } = params

		if (!userOrgId || !recipeId) return

		await Promise.all([
			context.queryClient.prefetchQuery(
				orpc.ingredient.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.recipe.get.queryOptions({
					input: { id: recipeId },
				}),
			),
		])
	},
	ssr: false,
})

function EditRecipePage() {
	const navigate = useNavigate()
	const { session } = Route.useRouteContext()
	const { orgSlug, recipeId } = Route.useParams()
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return (
		<div className='w-full'>
			<RecipeEditForm
				organisationId={userOrgId}
				recipeId={recipeId}
				onSuccess={() => {
					navigate({
						to: '/$orgSlug/recipes',
						params: { orgSlug },
					})
				}}
			/>
		</div>
	)
}
