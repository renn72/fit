import { WorkoutCreateForm } from '@/components/admin/workout-create-form'
import { orpc } from '@/utils/orpc'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/workouts/create')({
	component: WorkoutCreatePage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return

		await Promise.all([
			context.queryClient.prefetchQuery(
				orpc.exercise.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.warmup.getAllGroups.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
		])
	},
	ssr: false,
})

function WorkoutCreatePage() {
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()

	return (
		<div className='flex flex-col gap-4 p-4 w-full max-w-4xl mx-auto'>
			<div className='flex items-center gap-4'>
				<button
					onClick={() =>
						navigate({ to: '/$orgSlug/workouts', params: { orgSlug } })
					}
					className='text-sm text-muted-foreground hover:text-foreground'
				>
					← Back to Workouts
				</button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>Create Workout</h1>
				<p className='text-muted-foreground'>
					Create a new workout with exercises, supersets, and optional warmup.
				</p>
			</div>

			<WorkoutCreateForm
				onSuccess={() => {
					navigate({ to: '/$orgSlug/workouts', params: { orgSlug } })
				}}
			/>
		</div>
	)
}
