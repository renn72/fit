import { useState } from 'react'

import { LoadingButton } from '@/components/ui-extended/loading-button'
import { getUser } from '@/functions/get-user'
import { orpc } from '@/utils/orpc'

import { useMutation, useQuery } from '@tanstack/react-query'
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
	const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false)
	const [selectedOrgId, setSelectedOrgId] = useState<string>('')

	const { data: organisations } = useQuery(
		orpc.organisation.getAll.queryOptions({}),
	)

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

	const generateRecipes = useMutation(
		orpc.adminSetup.generateRecipes.mutationOptions({
			onMutate: () => setIsGeneratingRecipes(true),
			onSettled: () => setIsGeneratingRecipes(false),
			onSuccess: () => toast.success('10 recipes generated successfully'),
			onError: (err) => toast.error(err.message),
		}),
	)

	return (
		<div className='flex flex-col gap-6 justify-center items-center p-8'>
			<div className='flex flex-col gap-4 w-full max-w-md'>
				<h2 className='text-xl font-semibold'>Import Data</h2>
				<LoadingButton
					loading={isMutatingExercises}
					className='w-full cursor-pointer'
					onMouseDown={() => importExercises.mutate({})}
				>
					Import Exercises
				</LoadingButton>

				<LoadingButton
					loading={isMutatingIngredients}
					className='w-full cursor-pointer'
					onMouseDown={() => importBaseIngredients.mutate({})}
				>
					Import Base Ingredients
				</LoadingButton>

				<LoadingButton
					variant='secondary'
					loading={isGeneratingData}
					className='w-full cursor-pointer'
					onMouseDown={() => generateDummyData.mutate({})}
				>
					Generate Org Dummy Data
				</LoadingButton>
			</div>

			<div className='pt-6 w-full max-w-md border-t'>
				<h2 className='mb-4 text-xl font-semibold'>Generate Recipes</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Select an organization to generate 10 random recipes with 3-4
					ingredients each (10-100g).
				</p>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label htmlFor='org-select' className='text-sm font-medium'>
							Select Organization
						</label>
						<select
							id='org-select'
							value={selectedOrgId}
							onChange={(e) => setSelectedOrgId(e.target.value)}
							className='flex py-2 px-3 w-full h-10 text-sm rounded-md border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed border-input bg-background ring-offset-background focus-visible:ring-ring'
						>
							<option value=''>Select an organization...</option>
							{organisations?.map((org) => (
								<option key={org.id} value={org.id}>
									{org.name}
								</option>
							))}
						</select>
					</div>

					<LoadingButton
						variant='default'
						loading={isGeneratingRecipes}
						disabled={!selectedOrgId}
						className='w-full cursor-pointer'
						onMouseDown={() => {
							if (selectedOrgId) {
								generateRecipes.mutate({ organisationId: selectedOrgId })
							}
						}}
					>
						Generate 10 Recipes
					</LoadingButton>
				</div>
			</div>
		</div>
	)
}
