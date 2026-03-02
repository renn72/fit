import {
	WarmupGroupForm,
	type WarmupGroupFormGroup,
} from '@/components/admin/warmup/warmup-group-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/warmups_/edit/$warmupGroupId')({
	component: EditWarmupGroupPage,
	loader: async ({ context, params }) => {
		await context.queryClient.prefetchQuery(
			orpc.warmup.getGroup.queryOptions({
				input: { id: params.warmupGroupId },
			}),
		)
	},
	ssr: false,
})

function EditWarmupGroupPage() {
	const navigate = useNavigate()
	const { orgSlug, warmupGroupId } = Route.useParams()

	const { data: group } = useSuspenseQuery(
		orpc.warmup.getGroup.queryOptions({
			input: { id: warmupGroupId },
		}),
	)

	if (!group) {
		return <div>Warmup group not found</div>
	}

	const formGroup: WarmupGroupFormGroup = {
		id: group.id,
		name: group.name,
		description: group.description,
		warmups: (group.warmups ?? []).map((warmup) => ({
			id: warmup.id,
			name: warmup.name,
			description: warmup.description,
			images: warmup.images,
			link: warmup.link,
		})),
	}

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
				<h1 className='text-2xl font-bold tracking-tight'>Edit Warmup Group</h1>
				<p className='text-muted-foreground'>
					Update the group details and exercises.
				</p>
			</div>

			<WarmupGroupForm
				mode='edit'
				group={formGroup}
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
