import { RecipeCreateForm } from '@/components/admin/recipe/recipe-create-form'
import { orpc } from '@/utils/orpc'

import { createFileRoute, useRouteContext } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/recipes/create')({
	component: CreateRecipePage,
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

function CreateRecipePage() {
	const { session } = useRouteContext({
		from: '/$orgSlug/recipes/create',
	})
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return (
		<div className='flex flex-col gap-6 p-6 mx-auto w-full max-w-4xl'>
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold tracking-tight'>Create Recipe</h1>
				<p className='text-muted-foreground'>
					Create a new recipe by filling in the details below and adding
					ingredients.
				</p>
			</div>
			<RecipeCreateForm organisationId={userOrgId} />
		</div>
	)
}
