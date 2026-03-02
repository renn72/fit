import {
	WorkoutCreateForm,
	type WorkoutFormWorkout,
} from '@/components/admin/workout/workout-create-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/workouts_/edit/$workoutId')({
	component: EditWorkoutPage,
	loader: async ({ context, params }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId
		if (!userOrgId) return

		await Promise.all([
			context.queryClient.prefetchQuery(
				orpc.workout.get.queryOptions({
					input: { id: params.workoutId },
				}),
			),
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

function EditWorkoutPage() {
	const navigate = useNavigate()
	const { orgSlug, workoutId } = Route.useParams()
	const { session } = Route.useRouteContext()
	const userOrgId = session?.user?.organisationId

	const { data: workout } = useSuspenseQuery(
		orpc.workout.get.queryOptions({
			input: { id: workoutId },
		}),
	)

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	if (!workout) {
		return <div>Workout not found</div>
	}

	const formWorkout: WorkoutFormWorkout = {
		id: workout.id,
		name: workout.name,
		description: workout.description,
		category: workout.category,
		warmupGroupId: workout.warmupGroupId ?? null,
		exercises: (workout.exercises ?? []).map((link) => ({
			id: link.id,
			index: link.index,
			exercise: {
				id: link.exercise.id,
				name: link.exercise.name,
				movement: link.exercise.movement
					? {
							name: link.exercise.movement.name,
						}
					: null,
			},
		})),
		superSets: (workout.superSets ?? []).map((link) => ({
			id: link.id,
			index: link.index,
			superSet: {
				id: link.superSet.id,
				name: link.superSet.name,
				superSetExercises: link.superSet.superSetExercises ?? [],
			},
		})),
	}

	return (
		<div className='mx-auto flex w-full max-w-6xl flex-col gap-4 p-4'>
			<div className='flex items-center gap-4'>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/workouts',
							params: { orgSlug },
						})
					}
				>
					← Back to Workouts
				</Button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>Edit Workout</h1>
				<p className='text-muted-foreground'>
					Update workout details and reorder the exercise structure.
				</p>
			</div>

			<WorkoutCreateForm
				mode='edit'
				organisationId={userOrgId}
				workout={formWorkout}
				onSuccess={() => {
					navigate({
						to: '/$orgSlug/workouts',
						params: { orgSlug },
					})
				}}
			/>
		</div>
	)
}
