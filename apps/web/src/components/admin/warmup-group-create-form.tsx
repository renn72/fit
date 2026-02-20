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
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const warmupItemSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable().optional(),
	images: z.string().nullable().optional(),
	link: z.string().nullable().optional(),
})

const warmupGroupCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable().optional(),
	warmups: z.array(warmupItemSchema).min(1, 'At least one warmup is required'),
})

type WarmupItem = {
	name: string
	description: string | null
	images: string | null
	link: string | null
}

export interface WarmupGroupCreateFormProps {
	onSuccess?: () => void
}

export function WarmupGroupCreateForm({
	onSuccess,
}: WarmupGroupCreateFormProps) {
	const queryClient = useQueryClient()

	const createGroup = useMutation(
		orpc.warmup.createGroupWithWarmups.mutationOptions({
			onSuccess: () => {
				toast.success('Warmup created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.warmup.getAllGroups.key(),
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
			warmups: [
				{ name: '', description: null, images: null, link: null },
			] as WarmupItem[],
		},
		validators: {
			onSubmit: warmupGroupCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createGroup.mutateAsync({
				name: value.name,
				description: value.description || null,
				warmups: value.warmups.map((w) => ({
					name: w.name,
					description: w.description || null,
					images: w.images || null,
					link: w.link || null,
				})),
			})
		},
	})

	const addWarmup = () => {
		const currentWarmups = form.getFieldValue('warmups')
		form.setFieldValue('warmups', [
			...currentWarmups,
			{ name: '', description: null, images: null, link: null },
		])
	}

	const removeWarmup = (index: number) => {
		const currentWarmups = form.getFieldValue('warmups')
		if (currentWarmups.length > 1) {
			form.setFieldValue(
				'warmups',
				currentWarmups.filter((_, i) => i !== index),
			)
		}
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
							<FieldLabel htmlFor={field.name}>Warmup Name *</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='e.g., Upper Body Warmup'
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
								placeholder='Optional description for this warmup...'
								className='min-h-20'
							/>
						</Field>
					)}
				</form.Field>

				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<FieldLabel>Warmup Exercises</FieldLabel>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={addWarmup}
						>
							Add Exercise
						</Button>
					</div>

					<form.Field name='warmups'>
						{(field) => (
							<div className='space-y-4'>
								{field.state.value.map((_, index) => (
									<div
										key={index}
										className='border rounded-lg p-4 space-y-3 relative'
									>
										{field.state.value.length > 1 && (
											<Button
												type='button'
												variant='ghost'
												size='sm'
												className='absolute top-2 right-2 h-8 w-8 p-0'
												onClick={() => removeWarmup(index)}
											>
												×
											</Button>
										)}

										<div className='font-medium text-sm text-muted-foreground'>
											Exercise {index + 1}
										</div>

										<form.Field name={`warmups[${index}].name`}>
											{(subField) => (
												<Field
													data-invalid={subField.state.meta.errors.length > 0}
												>
													<FieldLabel htmlFor={subField.name}>
														Name *
													</FieldLabel>
													<Input
														id={subField.name}
														name={subField.name}
														value={subField.state.value}
														onBlur={subField.handleBlur}
														onChange={(e) =>
															subField.handleChange(e.target.value)
														}
														placeholder='e.g., Arm Circles'
													/>
													<FieldError errors={subField.state.meta.errors} />
												</Field>
											)}
										</form.Field>

										<form.Field name={`warmups[${index}].description`}>
											{(subField) => (
												<Field>
													<FieldLabel htmlFor={subField.name}>
														Description
													</FieldLabel>
													<Input
														id={subField.name}
														name={subField.name}
														value={subField.state.value ?? ''}
														onBlur={subField.handleBlur}
														onChange={(e) =>
															subField.handleChange(e.target.value || null)
														}
														placeholder='Optional description...'
													/>
												</Field>
											)}
										</form.Field>

										<div className='grid grid-cols-2 gap-3'>
											<form.Field name={`warmups[${index}].images`}>
												{(subField) => (
													<Field>
														<FieldLabel htmlFor={subField.name}>
															Image URL
														</FieldLabel>
														<Input
															id={subField.name}
															name={subField.name}
															value={subField.state.value ?? ''}
															onBlur={subField.handleBlur}
															onChange={(e) =>
																subField.handleChange(e.target.value || null)
															}
															placeholder='https://...'
														/>
													</Field>
												)}
											</form.Field>

											<form.Field name={`warmups[${index}].link`}>
												{(subField) => (
													<Field>
														<FieldLabel htmlFor={subField.name}>
															Video Link
														</FieldLabel>
														<Input
															id={subField.name}
															name={subField.name}
															value={subField.state.value ?? ''}
															onBlur={subField.handleBlur}
															onChange={(e) =>
																subField.handleChange(e.target.value || null)
															}
															placeholder='https://...'
														/>
													</Field>
												)}
											</form.Field>
										</div>
									</div>
								))}

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
							{isSubmitting ? 'Creating...' : 'Create Warmup'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
