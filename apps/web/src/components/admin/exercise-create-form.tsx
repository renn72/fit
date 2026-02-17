'use client'

import { Button } from '@/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TagsInput } from '@/components/ui-extended/tags-input'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const exerciseCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	category: z.array(z.string()),
	level: z.string(),
	force: z.string(),
	mechanic: z.string(),
	equipment: z.string(),
	primaryMuscles: z.string(),
	secondaryMuscles: z.string(),
	instructions: z.string(),
	images: z.string(),
})

export interface ExerciseCreateFormProps {
	onSuccess?: () => void
}

const categories = [
	'strength',
	'stretching',
	'plyometrics',
	'strongman',
	'powerlifting',
	'cardio',
	'olympic weightlifting',
]

export function ExerciseCreateForm({ onSuccess }: ExerciseCreateFormProps) {
	const queryClient = useQueryClient()

	const createExercise = useMutation(
		orpc.exercise.create.mutationOptions({
			onSuccess: () => {
				toast.success('Exercise created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.getAllOrg.key(),
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
			category: [] as string[],
			level: 'beginner',
			force: 'push',
			mechanic: 'compound',
			equipment: 'body only',
			primaryMuscles: '',
			secondaryMuscles: '',
			instructions: '',
			images: '',
		},
		validators: {
			onSubmit: exerciseCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createExercise.mutateAsync({
				...value,
				category: value.category.length === 0 ? null : value.category.join(','),
				level: value.level === '' ? null : value.level,
				force: value.force === '' ? null : value.force,
				mechanic: value.mechanic === '' ? null : value.mechanic,
				equipment: value.equipment === '' ? null : value.equipment,
				primaryMuscles:
					value.primaryMuscles === '' ? null : value.primaryMuscles,
				secondaryMuscles:
					value.secondaryMuscles === '' ? null : value.secondaryMuscles,
				instructions: value.instructions === '' ? null : value.instructions,
				images: value.images === '' ? null : value.images,
			})
		},
	})

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
							<FieldLabel htmlFor={field.name}>Name</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<div className='grid grid-cols-2 gap-4'>
					<form.Field name='category'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Category</FieldLabel>
								<TagsInput
									value={field.state.value}
									onValueChange={field.handleChange}
									suggestions={categories}
									placeholder='Select or type category...'
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='level'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Level</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(e) => field.handleChange(e || '')}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Select level' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='beginner'>Beginner</SelectItem>
										<SelectItem value='intermediate'>Intermediate</SelectItem>
										<SelectItem value='expert'>Expert</SelectItem>
									</SelectContent>
								</Select>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid grid-cols-3 gap-4'>
					<form.Field name='force'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Force</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(e) => field.handleChange(e || '')}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Select force' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='push'>Push</SelectItem>
										<SelectItem value='pull'>Pull</SelectItem>
										<SelectItem value='static'>Static</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						)}
					</form.Field>

					<form.Field name='mechanic'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Mechanic</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(e) => field.handleChange(e || '')}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Select mechanic' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='compound'>Compound</SelectItem>
										<SelectItem value='isolation'>Isolation</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						)}
					</form.Field>

					<form.Field name='equipment'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Equipment</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(e) => field.handleChange(e || '')}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Select equipment' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='body only'>Body Only</SelectItem>
										<SelectItem value='machine'>Machine</SelectItem>
										<SelectItem value='kettlebells'>Kettlebells</SelectItem>
										<SelectItem value='dumbbell'>Dumbbell</SelectItem>
										<SelectItem value='cable'>Cable</SelectItem>
										<SelectItem value='barbell'>Barbell</SelectItem>
										<SelectItem value='bands'>Bands</SelectItem>
										<SelectItem value='medicine ball'>Medicine Ball</SelectItem>
										<SelectItem value='exercise ball'>Exercise Ball</SelectItem>
										<SelectItem value='e-z curl bar'>E-Z Curl Bar</SelectItem>
										<SelectItem value='foam roll'>Foam Roll</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						)}
					</form.Field>
				</div>

				<form.Field name='primaryMuscles'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Primary Muscles</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='e.g. chest, triceps (comma separated)'
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name='secondaryMuscles'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Secondary Muscles</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='e.g. shoulders (comma separated)'
							/>
						</Field>
					)}
				</form.Field>

				<form.Field name='instructions'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Instructions</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='Enter instructions (comma separated steps)'
								className='min-h-25'
							/>
							<FieldDescription>
								Separate steps with commas or keep it as a single block.
							</FieldDescription>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name='images'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Images</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='Image URLs (comma separated)'
							/>
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			<div className='flex justify-end pt-4'>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button type='submit' disabled={!canSubmit || isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create Exercise'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
