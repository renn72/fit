import { useState } from 'react'

import { LoadingButton } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/dictator/')({
	component: RouteComponent,
})

function RouteComponent() {
	const [isMutatingIngredients, setIsMutatingIngredients] = useState(false)
	const [isMutatingExercises, setIsMutatingExercises] = useState(false)

	const importExercises = useMutation(
		orpc.adminSetup.importExercises.mutationOptions({
			onMutate: () => setIsMutatingExercises(true),
			onSettled: () => setIsMutatingExercises(false),
		}),
	)

	const importBaseIngredients = useMutation(
		orpc.adminSetup.importBaseIngredients.mutationOptions({
			onMutate: () => setIsMutatingIngredients(true),
			onSettled: () => setIsMutatingIngredients(false),
		}),
	)

	return (
		<div className='flex flex-col gap-4 justify-center items-center p-4'>
			<LoadingButton
				loading={isMutatingExercises}
				className='w-80 cursor-pointer'
				onMouseDown={() => importExercises.mutate({})}
			>
				Import Exercises
			</LoadingButton>

			<LoadingButton
				loading={isMutatingIngredients}
				className='w-80 cursor-pointer'
				onMouseDown={() => importBaseIngredients.mutate({})}
			>
				Import Base Ingredients
			</LoadingButton>
		</div>
	)
}
