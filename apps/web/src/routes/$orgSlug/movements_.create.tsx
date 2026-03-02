import { MovementForm } from '@/components/admin/movement/movement-form'
import { Button } from '@/components/ui/button'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/movements_/create')({
	component: CreateMovementPage,
	ssr: false,
})

function CreateMovementPage() {
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()

	return (
		<div className='mx-auto flex w-full max-w-5xl flex-col gap-4 p-4'>
			<div className='flex items-center gap-4'>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/movements',
							params: { orgSlug },
						})
					}
					className='text-sm text-muted-foreground hover:text-foreground'
				>
					← Back to Movements
				</Button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>Create Movement</h1>
				<p className='text-muted-foreground'>
					Add a new movement to your organisation.
				</p>
			</div>

			<MovementForm
				mode='create'
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
