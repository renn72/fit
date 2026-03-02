import { ExerciseForm } from '@/components/admin/exercise/exercise-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/exercises_/create')({
	component: CreateExercisePage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return

		await context.queryClient.prefetchQuery(
			orpc.movement.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)

		await context.queryClient.prefetchQuery(
			orpc.exercise.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})

function CreateExercisePage() {
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()
	const { session } = Route.useRouteContext()
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return (
		<div className='flex flex-col gap-4 p-4 mx-auto w-full max-w-5xl'>
			<div className='flex gap-4 items-center'>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/exercises',
							params: { orgSlug },
						})
					}
				>
					← Back to Exercises
				</Button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>Create Exercise</h1>
				<p className='text-muted-foreground'>
					Add a new exercise to your organisation.
				</p>
			</div>

			<ExerciseForm
				mode='create'
				organisationId={userOrgId}
				onSuccess={() => {
					navigate({
						to: '/$orgSlug/exercises',
						params: { orgSlug },
					})
				}}
			/>
		</div>
	)
}
