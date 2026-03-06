import { DocsLink } from '@/components/docs-link'
import { IngredientForm } from '@/components/admin/ingredient/ingredient-form'
import { Button } from '@/components/ui/button'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/ingredients_/create')({
	component: CreateIngredientPage,
	ssr: false,
})

function CreateIngredientPage() {
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()
	const { session } = Route.useRouteContext()
	const organisationId = session?.user?.organisationId

	if (!organisationId) {
		return <div>Missing organization</div>
	}

	return (
		<div className='flex flex-col gap-4 p-4 mx-auto w-full max-w-4xl'>
			<div className='flex gap-4 items-center'>
				<Button
					onClick={() =>
						navigate({ to: '/$orgSlug/ingredients', params: { orgSlug } })
					}
				>
					← Back to Ingredients
				</Button>
			</div>

			<div className='flex flex-wrap gap-3 justify-between items-start'>
				<div className='space-y-2'>
					<h1 className='text-2xl font-bold tracking-tight'>
						Create Ingredient
					</h1>
					<p className='text-muted-foreground'>
						Add a new ingredient to your organisation.
					</p>
				</div>
				<DocsLink doc='createIngredients' label='Ingredient Docs' />
			</div>

			<IngredientForm
				mode='create'
				organisationId={organisationId}
				onSuccess={() => {
					navigate({ to: '/$orgSlug/ingredients', params: { orgSlug } })
				}}
			/>
		</div>
	)
}
