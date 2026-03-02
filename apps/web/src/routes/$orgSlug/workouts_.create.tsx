import { WorkoutCreateForm } from '@/components/admin/workout/workout-create-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/workouts_/create')({
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
	const { session } = Route.useRouteContext()
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return (
		<div className='flex flex-col gap-4 p-4 mx-auto w-full max-w-6xl'>
			<div className='flex gap-4 items-center'>
				<Button
					onClick={() =>
						navigate({ to: '/$orgSlug/workouts', params: { orgSlug } })
					}
					className='text-sm text-muted-foreground hover:text-foreground'
				>
					← Back to Workouts
				</Button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>Create Workout</h1>
				<p className='text-muted-foreground'>
					Create a new workout with exercises, supersets, and optional warmup.
				</p>
			</div>

			<WorkoutCreateForm
				mode='create'
				organisationId={userOrgId}
				onSuccess={() => {
					navigate({ to: '/$orgSlug/workouts', params: { orgSlug } })
				}}
			/>
		</div>
	)
}
