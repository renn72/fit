'use client'

import { Button } from '@/components/ui/button'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const workoutItemSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	type: z.enum(['exercise', 'superset']),
	index: z.number().int(),
})

const workoutCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	warmupGroupId: z.string().nullable().optional(),
	items: z
		.array(workoutItemSchema)
		.min(1, 'At least one exercise or superset is required'),
})

type WorkoutItem = {
	id: string
	name: string
	type: 'exercise' | 'superset'
	index: number
}

export interface WorkoutCreateFormProps {
	onSuccess?: () => void
}

export function WorkoutCreateForm({ onSuccess }: WorkoutCreateFormProps) {
	const queryClient = useQueryClient()

	const { data: exercises } = useQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId: '' }, // Will be filled by session
		}),
	)

	const { data: warmupGroups } = useQuery(
		orpc.warmup.getAllGroups.queryOptions({
			input: { organisationId: '' }, // Will be filled by session
		}),
	)

	const createWorkout = useMutation(
		orpc.workout.create.mutationOptions({
			onSuccess: () => {
				toast.success('Workout created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.workout.getAllOrg.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const form = useForm({
		defaultValues: {
			name: '',
			description: '' as string | null,
			category: '' as string | null,
			warmupGroupId: '' as string | null,
			items: [] as WorkoutItem[],
		},
		validators: {
			onSubmit: workoutCreateSchema,
		},
		onSubmit: async ({ value }) => {
			// First create the workout
			const workoutData = await createWorkout.mutateAsync({
				name: value.name,
				description: value.description || null,
				category: value.category || null,
			})

			// Then add exercises and supersets with their indices
			for (const item of value.items) {
				if (item.type === 'exercise') {
					await orpc.workout.addExercise.mutate({
						workoutId: workoutData.id,
						exerciseId: item.id,
						index: item.index,
					})
				} else {
					await orpc.workout.addSuperSet.mutate({
						workoutId: workoutData.id,
						superSetId: item.id,
						index: item.index,
					})
				}
			}

			// Add warmup if selected
			if (value.warmupGroupId) {
				await orpc.workout.update.mutate({
					id: workoutData.id,
					warmupGroupId: value.warmupGroupId,
				})
			}
		},
	})

	const addItem = (item: {
		id: string
		name: string
		type: 'exercise' | 'superset'
	}) => {
		const currentItems = form.getFieldValue('items')
		form.setFieldValue('items', [
			...currentItems,
			{ ...item, index: currentItems.length },
		])
	}

	const removeItem = (index: number) => {
		const currentItems = form.getFieldValue('items')
		const newItems = currentItems
			.filter((_, i) => i !== index)
			.map((item, i) => ({ ...item, index: i }))
		form.setFieldValue('items', newItems)
	}

	const moveItem = (fromIndex: number, toIndex: number) => {
		const currentItems = form.getFieldValue('items')
		if (toIndex < 0 || toIndex >= currentItems.length) return

		const newItems = [...currentItems]
		const [movedItem] = newItems.splice(fromIndex, 1)
		newItems.splice(toIndex, 0, movedItem)

		// Update indices
		const reindexedItems = newItems.map((item, i) => ({ ...item, index: i }))
		form.setFieldValue('items', reindexedItems)
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				form.handleSubmit()
			}}
			className='flex flex-col gap-4'
		>
			<FieldGroup>
				<form.Field name='name'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Workout Name *</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='e.g., Upper Body Strength'
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name='description'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Description</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value ?? ''}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value || null)}
								placeholder='Optional description for this workout...'
								className='min-h-20'
							/>
						</Field>
					)}
				</form.Field>

				<form.Field name='category'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Category</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value ?? ''}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value || null)}
								placeholder='e.g., Strength, Cardio, Hypertrophy'
							/>
						</Field>
					)}
				</form.Field>

				<form.Field name='warmupGroupId'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>
								Warmup Group (Optional)
							</FieldLabel>
							<select
								id={field.name}
								name={field.name}
								value={field.state.value ?? ''}
								onChange={(e) => field.handleChange(e.target.value || null)}
								className='flex w-full h-9 px-3 py-1 text-sm rounded-md border border-input bg-background'
							>
								<option value=''>No warmup</option>
								{warmupGroups?.map((group) => (
									<option key={group.id} value={group.id}>
										{group.name} ({group.warmups?.length || 0} exercises)
									</option>
								))}
							</select>
						</Field>
					)}
				</form.Field>

				{/* Workout Builder */}
				<div className='space-y-4 pt-4 border-t'>
					<div className='font-medium'>Workout Structure</div>

					{/* Add Items Section */}
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<div className='text-sm font-medium mb-2'>Add Exercises</div>
							<div className='max-h-40 overflow-y-auto border rounded-md p-2 space-y-1'>
								{exercises?.map((exercise) => (
									<button
										key={exercise.id}
										type='button'
										onClick={() =>
											addItem({
												id: exercise.id,
												name: exercise.name,
												type: 'exercise',
											})
										}
										className='w-full text-left px-2 py-1 text-sm hover:bg-muted rounded'
									>
										{exercise.name}
									</button>
								))}
							</div>
						</div>

						<div>
							<div className='text-sm font-medium mb-2'>Add Supersets</div>
							<div className='max-h-40 overflow-y-auto border rounded-md p-2 space-y-1'>
								{exercises
									?.filter((e) => e.isSuperSet)
									.map((superset) => (
										<button
											key={superset.id}
											type='button'
											onClick={() =>
												addItem({
													id: superset.id,
													name: superset.name,
													type: 'superset',
												})
											}
											className='w-full text-left px-2 py-1 text-sm hover:bg-muted rounded'
										>
											{superset.name} (Superset)
										</button>
									))}
							</div>
						</div>
					</div>

					{/* Selected Items */}
					<form.Field name='items'>
						{(field) => (
							<div className='space-y-2'>
								<div className='text-sm font-medium'>
									Selected Items ({field.state.value.length})
								</div>
								{field.state.value.length === 0 ? (
									<div className='text-sm text-muted-foreground border rounded-md p-4 text-center'>
										No items selected. Click exercises or supersets above to add
										them.
									</div>
								) : (
									<div className='space-y-2'>
										{field.state.value.map((item, index) => (
											<div
												key={`${item.id}-${index}`}
												className='flex items-center gap-2 p-2 bg-muted rounded-md'
											>
												<span className='text-muted-foreground w-6'>
													{index + 1}.
												</span>
												<span
													className={`px-2 py-0.5 text-xs rounded ${
														item.type === 'exercise'
															? 'bg-blue-100 text-blue-700'
															: 'bg-purple-100 text-purple-700'
													}`}
												>
													{item.type === 'exercise' ? 'Ex' : 'SS'}
												</span>
												<span className='flex-1'>{item.name}</span>
												<div className='flex gap-1'>
													<Button
														type='button'
														variant='ghost'
														size='sm'
														className='h-7 w-7 p-0'
														onClick={() => moveItem(index, index - 1)}
														disabled={index === 0}
													>
														↑
													</Button>
													<Button
														type='button'
														variant='ghost'
														size='sm'
														className='h-7 w-7 p-0'
														onClick={() => moveItem(index, index + 1)}
														disabled={index === field.state.value.length - 1}
													>
														↓
													</Button>
													<Button
														type='button'
														variant='ghost'
														size='sm'
														className='h-7 w-7 p-0 text-red-500'
														onClick={() => removeItem(index)}
													>
														×
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
								{field.state.meta.errors.length > 0 && (
									<p className='text-sm text-destructive'>
										{field.state.meta.errors.join(', ')}
									</p>
								)}
							</div>
						)}
					</form.Field>
				</div>
			</FieldGroup>

			<div className='flex justify-end pt-4'>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button type='submit' disabled={!canSubmit || isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create Workout'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
