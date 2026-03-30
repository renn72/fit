'use client'

import { Button } from '@fit/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@fit/components/ui/field'
import { Input } from '@fit/components/ui/input'
import { Textarea } from '@fit/components/ui/textarea'
import { TagsInput } from '@/components/ui-extended/tags-input'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const movementFormSchema = z.object({
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

export interface MovementFormMovement {
	id: string
	name: string
	category: string | null
	level: string | null
	force: string | null
	mechanic: string | null
	equipment: string | null
	primaryMuscles: string | null
	secondaryMuscles: string | null
	instructions: string | null
	images: string | null
}

export interface MovementFormProps {
	mode: 'create' | 'edit'
	movement?: MovementFormMovement
	onSuccess?: () => void
}

const CATEGORY_SUGGESTIONS = [
	'strength',
	'stretching',
	'plyometrics',
	'strongman',
	'powerlifting',
	'cardio',
	'olympic weightlifting',
]

const LEVEL_SUGGESTIONS = ['beginner', 'intermediate', 'expert']
const FORCE_SUGGESTIONS = ['push', 'pull', 'static']
const MECHANIC_SUGGESTIONS = ['compound', 'isolation']
const EQUIPMENT_SUGGESTIONS = [
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

function splitCsv(value: string | null | undefined): string[] {
	if (!value) return []
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

function joinCsv(value: string[]): string | null {
	const cleaned = value.map((item) => item.trim()).filter(Boolean)
	if (cleaned.length === 0) return null
	return cleaned.join(',')
}

export function MovementForm({ mode, movement, onSuccess }: MovementFormProps) {
	const queryClient = useQueryClient()
	const isEditMode = mode === 'edit'

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

	const updateMovement = useMutation(
		orpc.movement.update.mutationOptions({
			onSuccess: () => {
				toast.success('Movement updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.movement.getAllOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.movement.get.key(),
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
			name: movement?.name ?? '',
			category: splitCsv(movement?.category),
			level: splitCsv(movement?.level),
			force: splitCsv(movement?.force),
			mechanic: splitCsv(movement?.mechanic),
			equipment: splitCsv(movement?.equipment),
			primaryMuscles: splitCsv(movement?.primaryMuscles),
			secondaryMuscles: splitCsv(movement?.secondaryMuscles),
			instructions: movement?.instructions ?? '',
			images: movement?.images ?? '',
		},
		validators: {
			onSubmit: movementFormSchema,
		},
		onSubmit: async ({ value }) => {
			const payload = {
				name: value.name.trim(),
				category: joinCsv(value.category),
				level: joinCsv(value.level),
				force: joinCsv(value.force),
				mechanic: joinCsv(value.mechanic),
				equipment: joinCsv(value.equipment),
				primaryMuscles: joinCsv(value.primaryMuscles),
				secondaryMuscles: joinCsv(value.secondaryMuscles),
				instructions: value.instructions.trim() || null,
				images: value.images.trim() || null,
			}

			if (isEditMode) {
				if (!movement?.id) return
				await updateMovement.mutateAsync({
					id: movement.id,
					...payload,
				})
				return
			}

			await createMovement.mutateAsync(payload)
		},
	})

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				form.handleSubmit()
			}}
			className='space-y-6'
		>
			<FieldGroup>
				<div className='grid gap-4 lg:grid-cols-2'>
					<form.Field name='name'>
						{(field) => (
							<Field
								className='lg:col-span-2'
								data-invalid={field.state.meta.errors.length > 0}
							>
								<FieldLabel htmlFor={field.name}>Name</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder='e.g. Barbell Bench Press'
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='category'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Category</FieldLabel>
								<TagsInput
									value={field.state.value}
									onValueChange={field.handleChange}
									suggestions={CATEGORY_SUGGESTIONS}
									placeholder='Select or type categories...'
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
									suggestions={LEVEL_SUGGESTIONS}
									placeholder='Select or type levels...'
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid gap-4 lg:grid-cols-3'>
					<form.Field name='force'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Force</FieldLabel>
								<TagsInput
									value={field.state.value}
									onValueChange={field.handleChange}
									suggestions={FORCE_SUGGESTIONS}
									placeholder='Select or type forces...'
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
									suggestions={MECHANIC_SUGGESTIONS}
									placeholder='Select or type mechanics...'
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
									suggestions={EQUIPMENT_SUGGESTIONS}
									placeholder='Select or type equipment...'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid gap-4 lg:grid-cols-2'>
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
									placeholder='e.g. front delts'
								/>
							</Field>
						)}
					</form.Field>
				</div>

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
								placeholder='Add cues or coaching notes for this movement...'
								className='min-h-28'
							/>
							<FieldDescription>
								Keep this concise so coaches can scan it quickly.
							</FieldDescription>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name='images'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Image URLs</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='Comma-separated image URLs'
								className='min-h-20'
							/>
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			<div className='flex justify-end border-t pt-4'>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button type='submit' disabled={!canSubmit || isSubmitting}>
							{isSubmitting
								? isEditMode
									? 'Updating...'
									: 'Creating...'
								: isEditMode
									? 'Update Movement'
									: 'Create Movement'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
