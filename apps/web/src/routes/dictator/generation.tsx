import { useState } from 'react'

import { LoadingButton } from '@/components/ui/button'
import { getUser } from '@/functions/get-user'
import { orpc } from '@/utils/orpc'

import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { toast } from 'sonner'

export const Route = createFileRoute('/dictator/generation')({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser()
		return { session }
	},
	loader: async ({ context }) => {
		if (!context) {
			redirect({
				to: '/',
				throw: true,
			})
		}
	},
})

function RouteComponent() {
	const [isMutatingIngredients, setIsMutatingIngredients] = useState(false)
	const [isMutatingExercises, setIsMutatingExercises] = useState(false)
	const [isGeneratingData, setIsGeneratingData] = useState(false)

	const importExercises = useMutation(
		orpc.adminSetup.importExercises.mutationOptions({
			onMutate: () => setIsMutatingExercises(true),
			onSettled: () => setIsMutatingExercises(false),
			onSuccess: () => toast.success('Exercises imported successfully'),
		}),
	)

	const importBaseIngredients = useMutation(
		orpc.adminSetup.importBaseIngredients.mutationOptions({
			onMutate: () => setIsMutatingIngredients(true),
			onSettled: () => setIsMutatingIngredients(false),
			onSuccess: () => toast.success('Ingredients imported successfully'),
		}),
	)

	const generateDummyData = useMutation(
		orpc.adminSetup.generateDummyData.mutationOptions({
			onMutate: () => setIsGeneratingData(true),
			onSettled: () => setIsGeneratingData(false),
			onSuccess: () => toast.success('Dummy data generated successfully'),
			onError: (err) => toast.error(err.message),
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

			<LoadingButton
				variant='secondary'
				loading={isGeneratingData}
				className='w-80 cursor-pointer'
				onMouseDown={() => generateDummyData.mutate({})}
			>
				Generate Org Dummy Data
			</LoadingButton>
		</div>
	)
}
