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
import { Textarea } from '@/components/ui/textarea'
import { TagsInput } from '@/components/ui-extended/tags-input'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const movementCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	category: z.array(z.string()),
	level: z.array(z.string()),
	force: z.array(z.string()),
	mechanic: z.array(z.string()),
	equipment: z.array(z.string()),
	primaryMuscles: z.array(z.string()),
	secondaryMuscles: z.array(z.string()),
	instructions: z.string(),
	images: z.string(),
})

export interface MovementCreateFormProps {
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

const levels = ['beginner', 'intermediate', 'expert']

const forces = ['push', 'pull', 'static']

const mechanics = ['compound', 'isolation']

const equipments = [
	'body only',
	'machine',
	'kettlebells',
	'dumbbell',
	'cable',
	'barbell',
	'bands',
	'medicine ball',
	'exercise ball',
	'e-z curl bar',
	'foam roll',
]

export function MovementCreateForm({ onSuccess }: MovementCreateFormProps) {
	const queryClient = useQueryClient()

	const createMovement = useMutation(
		orpc.movement.create.mutationOptions({
			onSuccess: () => {
				toast.success('Movement created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.movement.getAllOrg.key(),
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
			level: [] as string[],
			force: [] as string[],
			mechanic: [] as string[],
			equipment: [] as string[],
			primaryMuscles: [] as string[],
			secondaryMuscles: [] as string[],
			instructions: '',
			images: '',
		},
		validators: {
			onSubmit: movementCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createMovement.mutateAsync({
				...value,
				category: value.category.length === 0 ? null : value.category.join(','),
				level: value.level.length === 0 ? null : value.level.join(','),
				force: value.force.length === 0 ? null : value.force.join(','),
				mechanic: value.mechanic.length === 0 ? null : value.mechanic.join(','),
				equipment:
					value.equipment.length === 0 ? null : value.equipment.join(','),
				primaryMuscles:
					value.primaryMuscles.length === 0
						? null
						: value.primaryMuscles.join(','),
				secondaryMuscles:
					value.secondaryMuscles.length === 0
						? null
						: value.secondaryMuscles.join(','),
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
								<TagsInput
									value={field.state.value}
									onValueChange={field.handleChange}
									suggestions={levels}
									placeholder='Select or type level...'
								/>
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
								<TagsInput
									value={field.state.value}
									onValueChange={field.handleChange}
									suggestions={forces}
									placeholder='Select or type force...'
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name='mechanic'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Mechanic</FieldLabel>
								<TagsInput
									value={field.state.value}
									onValueChange={field.handleChange}
									suggestions={mechanics}
									placeholder='Select or type mechanic...'
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name='equipment'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Equipment</FieldLabel>
								<TagsInput
									value={field.state.value}
									onValueChange={field.handleChange}
									suggestions={equipments}
									placeholder='Select or type equipment...'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<form.Field name='primaryMuscles'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Primary Muscles</FieldLabel>
							<TagsInput
								value={field.state.value}
								onValueChange={field.handleChange}
								placeholder='e.g. chest, triceps'
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name='secondaryMuscles'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Secondary Muscles</FieldLabel>
							<TagsInput
								value={field.state.value}
								onValueChange={field.handleChange}
								placeholder='e.g. shoulders'
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
							{isSubmitting ? 'Creating...' : 'Create Movement'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
