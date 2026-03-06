import {
	IngredientForm,
	type IngredientFormIngredient,
} from '@/components/admin/ingredient/ingredient-form'
import { DocsLink } from '@/components/docs-link'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/$orgSlug/ingredients_/edit/$ingredientId',
)({
	component: EditIngredientPage,
	loader: async ({ context, params }) => {
		await context.queryClient.prefetchQuery(
			orpc.ingredient.get.queryOptions({
				input: { id: params.ingredientId },
			}),
		)
	},
	ssr: false,
})

function EditIngredientPage() {
	const navigate = useNavigate()
	const { orgSlug, ingredientId } = Route.useParams()
	const { session } = Route.useRouteContext()
	const organisationId = session?.user?.organisationId

	const { data: ingredient } = useSuspenseQuery(
		orpc.ingredient.get.queryOptions({
			input: { id: ingredientId },
		}),
	)

	if (!organisationId) {
		return <div>Missing organization</div>
	}

	if (!ingredient) {
		return <div>Ingredient not found</div>
	}

	const formIngredient: IngredientFormIngredient = {
		id: ingredient.id,
		name: ingredient.name,
		category: ingredient.category,
		calories: ingredient.calories,
		protein: ingredient.protein,
		fat: ingredient.fat,
		carbohydrate: ingredient.carbohydrate,
		serveSize: ingredient.serveSize,
		serveUnit: ingredient.serveUnit,
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
					<h1 className='text-2xl font-bold tracking-tight'>Edit Ingredient</h1>
					<p className='text-muted-foreground'>
						Update ingredient details and categories.
					</p>
				</div>
				<DocsLink doc='createIngredients' label='Ingredient Docs' />
			</div>

			<IngredientForm
				mode='edit'
				organisationId={organisationId}
				ingredient={formIngredient}
				onSuccess={() => {
					navigate({ to: '/$orgSlug/ingredients', params: { orgSlug } })
				}}
			/>
		</div>
	)
}
