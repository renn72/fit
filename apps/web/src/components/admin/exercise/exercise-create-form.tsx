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

const exerciseCreateSchema = z.object({
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

export interface ExerciseCreateFormProps {
	onSuccess?: () => void
	organisationId: string
}

export function ExerciseCreateForm({
	onSuccess,
	organisationId,
}: ExerciseCreateFormProps) {
	const queryClient = useQueryClient()

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

	const movementOptions =
		movements?.map((m) => ({
			value: m.id,
			label: m.name,
		})) ?? []

	const form = useForm({
		defaultValues: {
			name: '',
			movementId: null as string | null,
			sets: null as number | null,
			reps: null as number | null,
			repUnit: '' as string | null,
			ormPercent: null as number | null,
			targetRpe: null as number | null,
			restTime: null as number | null,
			restUnit: 'seconds' as string | null,
			tempoDown: null as number | null,
			tempoPause: null as number | null,
			tempoUp: null as number | null,
			notes: '' as string | null,
		},
		validators: {
			onSubmit: exerciseCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createExercise.mutateAsync({
				...value,
				repUnit: value.repUnit || null,
				restUnit: value.restUnit || null,
				notes: value.notes || null,
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
							<FieldLabel htmlFor={field.name}>Name *</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='e.g., Bench Press - Week 1'
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
								onSelectOption={(val) => field.handleChange(val || null)}
								searchPlaceholder='Select a movement...'
								width='100%'
								height='200px'
							/>
							<FieldDescription>
								Link this exercise to a base movement
							</FieldDescription>
						</Field>
					)}
				</form.Field>

				<div className='grid grid-cols-3 gap-4'>
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
										const val = e.target.value
										field.handleChange(val === '' ? null : Number.parseInt(val))
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
										const val = e.target.value
										field.handleChange(val === '' ? null : Number.parseInt(val))
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
									placeholder='e.g., reps, seconds'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid grid-cols-2 gap-4'>
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
										const val = e.target.value
										field.handleChange(
											val === '' ? null : Number.parseFloat(val),
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
										const val = e.target.value
										field.handleChange(
											val === '' ? null : Number.parseFloat(val),
										)
									}}
								/>
								<FieldDescription>
									Rate of Perceived Exertion (1-10)
								</FieldDescription>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid grid-cols-2 gap-4'>
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
										const val = e.target.value
										field.handleChange(val === '' ? null : Number.parseInt(val))
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
									placeholder='e.g., seconds, minutes'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid grid-cols-3 gap-4'>
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
										const val = e.target.value
										field.handleChange(val === '' ? null : Number.parseInt(val))
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
										const val = e.target.value
										field.handleChange(val === '' ? null : Number.parseInt(val))
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
										const val = e.target.value
										field.handleChange(val === '' ? null : Number.parseInt(val))
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
								placeholder='Any additional notes...'
								className='min-h-20'
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
