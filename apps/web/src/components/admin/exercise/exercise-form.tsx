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
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const exerciseFormSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	movementId: z.string().nullable(),
	sets: z.number().int().min(1).nullable(),
	reps: z.number().int().min(1).nullable(),
	repUnit: z.string().nullable(),
	ormPercent: z.number().min(0).max(100).nullable(),
	targetRpe: z.number().min(1).max(10).nullable(),
	restTime: z.number().int().min(0).nullable(),
	restUnit: z.string().nullable(),
	tempoDown: z.number().int().min(0).nullable(),
	tempoPause: z.number().int().min(0).nullable(),
	tempoUp: z.number().int().min(0).nullable(),
	notes: z.string().nullable(),
})

export interface ExerciseFormExercise {
	id: string
	name: string
	movementId: string | null
	sets: number | null
	reps: number | null
	repUnit: string | null
	ormPercent: number | null
	targetRpe: number | null
	restTime: number | null
	restUnit: string | null
	tempoDown: number | null
	tempoPause: number | null
	tempoUp: number | null
	notes: string | null
}

export interface ExerciseFormProps {
	mode: 'create' | 'edit'
	organisationId: string
	exercise?: ExerciseFormExercise
	onSuccess?: () => void
}

export function ExerciseForm({
	mode,
	organisationId,
	exercise,
	onSuccess,
}: ExerciseFormProps) {
	const queryClient = useQueryClient()
	const isEditMode = mode === 'edit'

	const { data: movements } = useQuery(
		orpc.movement.getAllOrg.queryOptions({
			input: { organisationId },
		}),
	)

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

	const updateExercise = useMutation(
		orpc.exercise.update.mutationOptions({
			onSuccess: () => {
				toast.success('Exercise updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.getAllOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.get.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const movementOptions =
		movements?.map((movement) => ({
			value: movement.id,
			label: movement.name,
		})) ?? []

	const form = useForm({
		defaultValues: {
			name: exercise?.name ?? '',
			movementId: exercise?.movementId ?? (null as string | null),
			sets: exercise?.sets ?? (null as number | null),
			reps: exercise?.reps ?? (null as number | null),
			repUnit: exercise?.repUnit ?? ('reps' as string | null),
			ormPercent: exercise?.ormPercent ?? (null as number | null),
			targetRpe: exercise?.targetRpe ?? (null as number | null),
			restTime: exercise?.restTime ?? (null as number | null),
			restUnit: exercise?.restUnit ?? ('seconds' as string | null),
			tempoDown: exercise?.tempoDown ?? (null as number | null),
			tempoPause: exercise?.tempoPause ?? (null as number | null),
			tempoUp: exercise?.tempoUp ?? (null as number | null),
			notes: exercise?.notes ?? ('' as string | null),
		},
		validators: {
			onSubmit: exerciseFormSchema,
		},
		onSubmit: async ({ value }) => {
			const payload = {
				name: value.name.trim(),
				movementId: value.movementId || null,
				sets: value.sets,
				reps: value.reps,
				repUnit: value.repUnit || null,
				ormPercent: value.ormPercent,
				targetRpe: value.targetRpe,
				restTime: value.restTime,
				restUnit: value.restUnit || null,
				tempoDown: value.tempoDown,
				tempoPause: value.tempoPause,
				tempoUp: value.tempoUp,
				notes: value.notes?.trim() || null,
			}

			if (isEditMode) {
				if (!exercise?.id) return
				await updateExercise.mutateAsync({
					id: exercise.id,
					...payload,
				})
				return
			}

			await createExercise.mutateAsync(payload)
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
								placeholder='e.g. Bench Press - Week 1'
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name='movementId'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Movement</FieldLabel>
							<VirtualizedCombobox
								options={movementOptions}
								selectedOption={field.state.value || ''}
								onSelectOption={(value) => field.handleChange(value || null)}
								searchPlaceholder='Select a movement...'
								width='100%'
								height='200px'
							/>
							<FieldDescription>
								Optional link to a movement definition.
							</FieldDescription>
						</Field>
					)}
				</form.Field>

				<div className='grid gap-4 lg:grid-cols-3'>
					<form.Field name='sets'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Sets</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseInt(value, 10),
										)
									}}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='reps'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Reps</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseInt(value, 10),
										)
									}}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='repUnit'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Rep Unit</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value || null)}
									placeholder='reps, sec, min'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid gap-4 lg:grid-cols-2'>
					<form.Field name='ormPercent'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>% 1RM</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='0'
									max='100'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseFloat(value),
										)
									}}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='targetRpe'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Target RPE</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='1'
									max='10'
									step='0.5'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseFloat(value),
										)
									}}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid gap-4 lg:grid-cols-2'>
					<form.Field name='restTime'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Rest Time</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='0'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseInt(value, 10),
										)
									}}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name='restUnit'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Rest Unit</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value || null)}
									placeholder='seconds, minutes'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid gap-4 lg:grid-cols-3'>
					<form.Field name='tempoDown'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Tempo Down</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='0'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseInt(value, 10),
										)
									}}
									placeholder='seconds'
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name='tempoPause'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Tempo Pause</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='0'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseInt(value, 10),
										)
									}}
									placeholder='seconds'
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name='tempoUp'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Tempo Up</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='0'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseInt(value, 10),
										)
									}}
									placeholder='seconds'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<form.Field name='notes'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Notes</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value ?? ''}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value || null)}
								placeholder='Programming notes, intent, or coaching cues.'
								className='min-h-24'
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
									? 'Update Exercise'
									: 'Create Exercise'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
