import { WarmupGroupForm } from '@/components/admin/warmup/warmup-group-form'
import { Button } from '@fit/components/ui/button'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/warmups_/create')({
	component: CreateWarmupGroupPage,
	ssr: false,
})

function CreateWarmupGroupPage() {
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()

	return (
		<div className='flex flex-col gap-4 p-4 mx-auto w-full max-w-5xl'>
			<div className='flex gap-4 items-center'>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/warmups',
							params: { orgSlug },
						})
					}
				>
					← Back to Warmups
				</Button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>
					Create Warmup Group
				</h1>
				<p className='text-muted-foreground'>
					Create a warmup group with one or more exercises.
				</p>
			</div>

			<WarmupGroupForm
				mode='create'
				onSuccess={() => {
					navigate({
						to: '/$orgSlug/warmups',
						params: { orgSlug },
					})
				}}
			/>
		</div>
	)
}
