import { WarmupGroupForm } from '@/components/admin/warmup/warmup-group-form'
import { Button } from '@/components/ui/button'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/warmups_/create')({
	component: CreateWarmupGroupPage,
	ssr: false,
})

function CreateWarmupGroupPage() {
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()

	return (
		<div className='mx-auto flex w-full max-w-5xl flex-col gap-4 p-4'>
			<div className='flex items-center gap-4'>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/warmups',
							params: { orgSlug },
						})
					}
					className='text-sm text-muted-foreground hover:text-foreground'
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
