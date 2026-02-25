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
	const [isGeneratingExercises, setIsGeneratingExercises] = useState(false)
	const [isGeneratingWarmups, setIsGeneratingWarmups] = useState(false)
	const [isGeneratingWorkouts, setIsGeneratingWorkouts] = useState(false)
	const [isGeneratingBlockTemplates, setIsGeneratingBlockTemplates] =
		useState(false)
	const [isGeneratingMenuTemplates, setIsGeneratingMenuTemplates] =
		useState(false)
	const [isGeneratingPlans, setIsGeneratingPlans] = useState(false)
	const [isGeneratingUsers, setIsGeneratingUsers] = useState(false)
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

	const generateExercises = useMutation(
		orpc.adminSetup.generateExercises.mutationOptions({
			onMutate: () => setIsGeneratingExercises(true),
			onSettled: () => setIsGeneratingExercises(false),
			onSuccess: () => toast.success('10 exercises generated successfully'),
			onError: (err) => toast.error(err.message),
		}),
	)

	const generateWarmups = useMutation(
		orpc.adminSetup.generateWarmups.mutationOptions({
			onMutate: () => setIsGeneratingWarmups(true),
			onSettled: () => setIsGeneratingWarmups(false),
			onSuccess: () => toast.success('5 warmup groups generated successfully'),
			onError: (err) => toast.error(err.message),
		}),
	)

	const generateWorkouts = useMutation(
		orpc.adminSetup.generateWorkouts.mutationOptions({
			onMutate: () => setIsGeneratingWorkouts(true),
			onSettled: () => setIsGeneratingWorkouts(false),
			onSuccess: () => toast.success('10-20 workouts generated successfully'),
			onError: (err) => toast.error(err.message),
		}),
	)

	const generateBlockTemplates = useMutation(
		orpc.adminSetup.generateBlockTemplates.mutationOptions({
			onMutate: () => setIsGeneratingBlockTemplates(true),
			onSettled: () => setIsGeneratingBlockTemplates(false),
			onSuccess: () =>
				toast.success('10 block templates generated successfully'),
			onError: (err) => toast.error(err.message),
		}),
	)

	const generateMenuTemplates = useMutation(
		orpc.adminSetup.generateMenuTemplates.mutationOptions({
			onMutate: () => setIsGeneratingMenuTemplates(true),
			onSettled: () => setIsGeneratingMenuTemplates(false),
			onSuccess: () =>
				toast.success('10 menu templates generated successfully'),
			onError: (err) => toast.error(err.message),
		}),
	)

	const generatePlans = useMutation(
		orpc.adminSetup.generatePlans.mutationOptions({
			onMutate: () => setIsGeneratingPlans(true),
			onSettled: () => setIsGeneratingPlans(false),
			onSuccess: () => toast.success('4 plans generated successfully'),
			onError: (err) => toast.error(err.message),
		}),
	)

	const generateUsers = useMutation(
		orpc.adminSetup.generateUsers.mutationOptions({
			onMutate: () => setIsGeneratingUsers(true),
			onSettled: () => setIsGeneratingUsers(false),
			onSuccess: () => toast.success('5 users generated successfully'),
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

				<LoadingButton
					variant='outline'
					loading={isGeneratingPlans}
					className='w-full cursor-pointer'
					onMouseDown={() => generatePlans.mutate({})}
				>
					Generate 4 Plans
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

			<div className='pt-6 w-full max-w-md border-t'>
				<h2 className='mb-4 text-xl font-semibold'>Generate Exercises</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Select an organization to generate 10 random exercises with various
					training parameters.
				</p>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label
							htmlFor='org-select-exercises'
							className='text-sm font-medium'
						>
							Select Organization
						</label>
						<select
							id='org-select-exercises'
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
						loading={isGeneratingExercises}
						disabled={!selectedOrgId}
						className='w-full cursor-pointer'
						onMouseDown={() => {
							if (selectedOrgId) {
								generateExercises.mutate({ organisationId: selectedOrgId })
							}
						}}
					>
						Generate 10 Exercises
					</LoadingButton>
				</div>
			</div>

			<div className='pt-6 w-full max-w-md border-t'>
				<h2 className='mb-4 text-xl font-semibold'>Generate Warmups</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Select an organization to generate 5 warmup groups with 2-4 exercises
					each.
				</p>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label htmlFor='org-select-warmups' className='text-sm font-medium'>
							Select Organization
						</label>
						<select
							id='org-select-warmups'
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
						loading={isGeneratingWarmups}
						disabled={!selectedOrgId}
						className='w-full cursor-pointer'
						onMouseDown={() => {
							if (selectedOrgId) {
								generateWarmups.mutate({ organisationId: selectedOrgId })
							}
						}}
					>
						Generate 5 Warmup Groups
					</LoadingButton>
				</div>
			</div>

			<div className='pt-6 w-full max-w-md border-t'>
				<h2 className='mb-4 text-xl font-semibold'>Generate Workouts</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Select an organization to generate 10-20 random workouts with 4-8
					exercises each and optional warmup.
				</p>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label
							htmlFor='org-select-workouts'
							className='text-sm font-medium'
						>
							Select Organization
						</label>
						<select
							id='org-select-workouts'
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
						loading={isGeneratingWorkouts}
						disabled={!selectedOrgId}
						className='w-full cursor-pointer'
						onMouseDown={() => {
							if (selectedOrgId) {
								generateWorkouts.mutate({ organisationId: selectedOrgId })
							}
						}}
					>
						Generate 10-20 Workouts
					</LoadingButton>
				</div>
			</div>

			<div className='pt-6 w-full max-w-md border-t'>
				<h2 className='mb-4 text-xl font-semibold'>Generate Block Templates</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Select an organization to generate 10 block templates with 4-5
					workouts each and 1-2 rest days.
				</p>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label
							htmlFor='org-select-block-templates'
							className='text-sm font-medium'
						>
							Select Organization
						</label>
						<select
							id='org-select-block-templates'
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
						loading={isGeneratingBlockTemplates}
						disabled={!selectedOrgId}
						className='w-full cursor-pointer'
						onMouseDown={() => {
							if (selectedOrgId) {
								generateBlockTemplates.mutate({ organisationId: selectedOrgId })
							}
						}}
					>
						Generate 10 Block Templates
					</LoadingButton>
				</div>
			</div>

			<div className='pt-6 w-full max-w-md border-t'>
				<h2 className='mb-4 text-xl font-semibold'>Generate Menu Templates</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Select an organization to generate 10 menu templates with 3-5 meals
					each and 1-2 recipes per meal.
				</p>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label
							htmlFor='org-select-menu-templates'
							className='text-sm font-medium'
						>
							Select Organization
						</label>
						<select
							id='org-select-menu-templates'
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
						loading={isGeneratingMenuTemplates}
						disabled={!selectedOrgId}
						className='w-full cursor-pointer'
						onMouseDown={() => {
							if (selectedOrgId) {
								generateMenuTemplates.mutate({ organisationId: selectedOrgId })
							}
						}}
					>
						Generate 10 Menu Templates
					</LoadingButton>
				</div>
			</div>

			<div className='pt-6 w-full max-w-md border-t'>
				<h2 className='mb-4 text-xl font-semibold'>Generate Users</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Select an organization to generate 5 random users and add them to the
					organization.
				</p>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label htmlFor='org-select-users' className='text-sm font-medium'>
							Select Organization
						</label>
						<select
							id='org-select-users'
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
						loading={isGeneratingUsers}
						disabled={!selectedOrgId}
						className='w-full cursor-pointer'
						onMouseDown={() => {
							if (selectedOrgId) {
								generateUsers.mutate({ organisationId: selectedOrgId })
							}
						}}
					>
						Generate 5 Users
					</LoadingButton>
				</div>
			</div>
		</div>
	)
}
