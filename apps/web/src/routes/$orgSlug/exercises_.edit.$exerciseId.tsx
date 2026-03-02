import {
	ExerciseForm,
	type ExerciseFormExercise,
} from '@/components/admin/exercise/exercise-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/exercises_/edit/$exerciseId')({
	component: EditExercisePage,
	loader: async ({ context, params }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId
		if (!userOrgId) return

		await Promise.all([
			context.queryClient.prefetchQuery(
				orpc.exercise.get.queryOptions({
					input: { id: params.exerciseId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.movement.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
		])
	},
	ssr: false,
})

function EditExercisePage() {
	const navigate = useNavigate()
	const { orgSlug, exerciseId } = Route.useParams()
	const { session } = Route.useRouteContext()
	const userOrgId = session?.user?.organisationId

	const { data: exercise } = useSuspenseQuery(
		orpc.exercise.get.queryOptions({
			input: { id: exerciseId },
		}),
	)

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	if (!exercise) {
		return <div>Exercise not found</div>
	}

	const formExercise: ExerciseFormExercise = {
		id: exercise.id,
		name: exercise.name,
		movementId: exercise.movementId,
		sets: exercise.sets,
		reps: exercise.reps,
		repUnit: exercise.repUnit,
		ormPercent: exercise.ormPercent,
		targetRpe: exercise.targetRpe,
		restTime: exercise.restTime,
		restUnit: exercise.restUnit,
		tempoDown: exercise.tempoDown,
		tempoPause: exercise.tempoPause,
		tempoUp: exercise.tempoUp,
		notes: exercise.notes,
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
				<h1 className='text-2xl font-bold tracking-tight'>Edit Exercise</h1>
				<p className='text-muted-foreground'>
					Update exercise details and prescriptions.
				</p>
			</div>

			<ExerciseForm
				mode='edit'
				organisationId={userOrgId}
				exercise={formExercise}
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
