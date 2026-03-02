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

import { PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { z } from 'zod'

const warmupItemSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable(),
	images: z.string().nullable(),
	link: z.string().nullable(),
})

const warmupGroupFormSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable(),
	warmups: z.array(warmupItemSchema).min(1, 'At least one warmup is required'),
})

export interface WarmupGroupFormWarmup {
	id: string
	name: string
	description: string | null
	images: string | null
	link: string | null
}

export interface WarmupGroupFormGroup {
	id: string
	name: string
	description: string | null
	warmups: WarmupGroupFormWarmup[]
}

export interface WarmupGroupFormProps {
	mode: 'create' | 'edit'
	group?: WarmupGroupFormGroup
	onSuccess?: () => void
}

type WarmupItemValue = {
	id?: string
	name: string
	description: string | null
	images: string | null
	link: string | null
}

export function WarmupGroupForm({
	mode,
	group,
	onSuccess,
}: WarmupGroupFormProps) {
	const queryClient = useQueryClient()
	const isEditMode = mode === 'edit'

	const createGroupWithWarmups = useMutation(
		orpc.warmup.createGroupWithWarmups.mutationOptions(),
	)
	const updateGroup = useMutation(orpc.warmup.updateGroup.mutationOptions())
	const createWarmup = useMutation(orpc.warmup.create.mutationOptions())
	const updateWarmup = useMutation(orpc.warmup.update.mutationOptions())
	const deleteWarmup = useMutation(orpc.warmup.delete.mutationOptions())

	const form = useForm({
		defaultValues: {
			name: group?.name ?? '',
			description: group?.description ?? ('' as string | null),
			warmups:
				group?.warmups.map((warmup) => ({
					id: warmup.id,
					name: warmup.name,
					description: warmup.description,
					images: warmup.images,
					link: warmup.link,
				})) ??
				([
					{
						name: '',
						description: null,
						images: null,
						link: null,
					},
				] as WarmupItemValue[]),
		},
		validators: {
			onSubmit: warmupGroupFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				if (!isEditMode) {
					await createGroupWithWarmups.mutateAsync({
						name: value.name.trim(),
						description: value.description?.trim() || null,
						warmups: value.warmups.map((warmup) => ({
							name: warmup.name.trim(),
							description: warmup.description?.trim() || null,
							images: warmup.images?.trim() || null,
							link: warmup.link?.trim() || null,
						})),
					})

					toast.success('Warmup group created successfully')
					queryClient.invalidateQueries({
						queryKey: orpc.warmup.getAllGroups.key(),
					})
					onSuccess?.()
					return
				}

				if (!group?.id) return

				await updateGroup.mutateAsync({
					id: group.id,
					name: value.name.trim(),
					description: value.description?.trim() || null,
				})

				const existingWarmupIds = new Set(
					(group.warmups ?? []).map((warmup) => warmup.id),
				)
				const nextWarmupIds = new Set(
					value.warmups
						.map((warmup) => warmup.id)
						.filter((id): id is string => !!id),
				)

				for (const existingId of existingWarmupIds) {
					if (!nextWarmupIds.has(existingId)) {
						await deleteWarmup.mutateAsync({ id: existingId })
					}
				}

				for (const warmup of value.warmups) {
					const payload = {
						name: warmup.name.trim(),
						description: warmup.description?.trim() || null,
						images: warmup.images?.trim() || null,
						link: warmup.link?.trim() || null,
					}

					if (warmup.id) {
						await updateWarmup.mutateAsync({
							id: warmup.id,
							...payload,
						})
						continue
					}

					await createWarmup.mutateAsync({
						warmupGroupId: group.id,
						...payload,
					})
				}

				toast.success('Warmup group updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.warmup.getAllGroups.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.warmup.getGroup.key(),
				})
				onSuccess?.()
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: 'Failed to save warmup group',
				)
			}
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
		if (currentWarmups.length <= 1) return
		form.setFieldValue(
			'warmups',
			currentWarmups.filter((_, warmupIndex) => warmupIndex !== index),
		)
	}

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
							<FieldLabel htmlFor={field.name}>Warmup Group Name</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='e.g. Upper Body Activation'
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
								placeholder='What should this warmup prepare the athlete for?'
								className='min-h-24'
							/>
						</Field>
					)}
				</form.Field>

				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<FieldLabel>Warmup Exercises</FieldLabel>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={addWarmup}
						>
							<PlusIcon className='mr-2 size-4' />
							Add Exercise
						</Button>
					</div>

					<form.Field name='warmups'>
						{(field) => (
							<div className='space-y-4'>
								{field.state.value.map((_, index) => (
									<div
										key={`${field.state.value[index]?.id ?? 'new'}-${index}`}
										className='space-y-3 rounded-xl border bg-card p-4'
									>
										<div className='flex items-center justify-between'>
											<p className='text-sm font-medium'>
												Exercise {index + 1}
											</p>
											{field.state.value.length > 1 && (
												<Button
													type='button'
													variant='ghost'
													size='icon'
													onClick={() => removeWarmup(index)}
												>
													<TrashIcon className='size-4 text-destructive' />
												</Button>
											)}
										</div>

										<form.Field name={`warmups[${index}].name`}>
											{(subField) => (
												<Field
													data-invalid={subField.state.meta.errors.length > 0}
												>
													<FieldLabel htmlFor={subField.name}>Name</FieldLabel>
													<Input
														id={subField.name}
														name={subField.name}
														value={subField.state.value}
														onBlur={subField.handleBlur}
														onChange={(e) =>
															subField.handleChange(e.target.value)
														}
														placeholder='e.g. Band Pull Apart'
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
														placeholder='Optional cue'
													/>
												</Field>
											)}
										</form.Field>

										<div className='grid gap-3 lg:grid-cols-2'>
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
									? 'Update Warmup Group'
									: 'Create Warmup Group'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
