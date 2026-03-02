import {
	MovementForm,
	type MovementFormMovement,
} from '@/components/admin/movement/movement-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/movements_/edit/$movementId')({
	component: EditMovementPage,
	loader: async ({ context, params }) => {
		await context.queryClient.prefetchQuery(
			orpc.movement.get.queryOptions({
				input: { id: params.movementId },
			}),
		)
	},
	ssr: false,
})

function EditMovementPage() {
	const navigate = useNavigate()
	const { orgSlug, movementId } = Route.useParams()

	const { data: movement } = useSuspenseQuery(
		orpc.movement.get.queryOptions({
			input: { id: movementId },
		}),
	)

	if (!movement) {
		return <div>Movement not found</div>
	}

	const formMovement: MovementFormMovement = {
		id: movement.id,
		name: movement.name,
		category: movement.category,
		level: movement.level,
		force: movement.force,
		mechanic: movement.mechanic,
		equipment: movement.equipment,
		primaryMuscles: movement.primaryMuscles,
		secondaryMuscles: movement.secondaryMuscles,
		instructions: movement.instructions,
		images: movement.images,
	}

	return (
		<div className='flex flex-col gap-4 p-4 mx-auto w-full max-w-5xl'>
			<div className='flex gap-4 items-center'>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/movements',
							params: { orgSlug },
						})
					}
				>
					← Back to Movements
				</Button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>Edit Movement</h1>
				<p className='text-muted-foreground'>
					Update movement details for your organisation.
				</p>
			</div>

			<MovementForm
				mode='edit'
				movement={formMovement}
				onSuccess={() => {
					navigate({
						to: '/$orgSlug/movements',
						params: { orgSlug },
					})
				}}
			/>
		</div>
	)
}
