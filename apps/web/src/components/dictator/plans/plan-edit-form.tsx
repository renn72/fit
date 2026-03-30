'use client'

import { Button } from '@fit/components/ui/button'
import { Checkbox } from '@fit/components/ui/checkbox'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@fit/components/ui/field'
import { Input } from '@fit/components/ui/input'
import { Textarea } from '@fit/components/ui/textarea'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const planUpdateSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1, 'Name is required'),
	description: z.string().min(1, 'Description is required'),
	features: z.string(),
	cta: z.string().min(1, 'CTA is required'),
	priceMonthly: z.number().int().min(0),
	priceYearly: z.number().int().min(0),
	maxMembers: z.number().int().min(1),
	maxTrainers: z.number().int().min(1),
	tags: z.string(),
	metaTags: z.string(),
	hidden: z.boolean(),
})

interface Plan {
	id: string
	name: string
	description: string
	features: string
	cta: string
	priceMonthly: number
	priceYearly: number
	maxMembers: number
	maxTrainers: number
	tags: string
	metaTags: string
	hidden: boolean
}

export interface PlanEditFormProps {
	plan: Plan
	onSuccess?: () => void
}

export function PlanEditForm({ plan: planData, onSuccess }: PlanEditFormProps) {
	const queryClient = useQueryClient()

	const updatePlan = useMutation(
		orpc.organisation.updatePlan.mutationOptions({
			onSuccess: () => {
				toast.success('Plan updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.organisation.getAllPlansAdmin.key(),
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
			id: planData.id,
			name: planData.name,
			description: planData.description,
			features: planData.features,
			cta: planData.cta,
			priceMonthly: planData.priceMonthly,
			priceYearly: planData.priceYearly,
			maxMembers: planData.maxMembers,
			maxTrainers: planData.maxTrainers,
			tags: planData.tags,
			metaTags: planData.metaTags,
			hidden: planData.hidden,
		},
		validators: {
			onSubmit: planUpdateSchema,
		},
		onSubmit: async ({ value }) => {
			await updatePlan.mutateAsync(value)
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

				<form.Field name='description'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Description</FieldLabel>
							<Textarea
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
					<form.Field name='priceMonthly'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>
									Monthly Price (cents)
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(Number(e.target.value))}
								/>
								<FieldDescription>Enter amount in cents</FieldDescription>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='priceYearly'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>
									Yearly Price (cents)
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(Number(e.target.value))}
								/>
								<FieldDescription>Enter amount in cents</FieldDescription>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</div>

				<div className='grid grid-cols-2 gap-4'>
					<form.Field name='maxMembers'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Max Members</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(Number(e.target.value))}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='maxTrainers'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Max Trainers</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(Number(e.target.value))}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</div>

				<form.Field name='cta'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Call to Action</FieldLabel>
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

				<form.Field name='features'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Features</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='Comma-separated features'
							/>
							<FieldDescription>
								Comma-separated list of features
							</FieldDescription>
						</Field>
					)}
				</form.Field>

				<form.Field name='tags'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Tags</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='Comma-separated tags'
							/>
							<FieldDescription>
								Comma-separated tags for categorization
							</FieldDescription>
						</Field>
					)}
				</form.Field>

				<form.Field name='metaTags'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Meta Tags</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder='Comma-separated meta tags'
							/>
							<FieldDescription>
								Comma-separated meta tags used for feature gating
							</FieldDescription>
						</Field>
					)}
				</form.Field>

				<form.Field name='hidden'>
					{(field) => (
						<Field className='flex flex-row items-start space-x-3 space-y-0 py-2'>
							<Checkbox
								checked={field.state.value}
								onCheckedChange={(checked) =>
									field.handleChange(checked === true)
								}
							/>
							<div className='space-y-1 leading-none'>
								<FieldLabel>Hidden Plan</FieldLabel>
								<FieldDescription>
									This plan will not be shown publicly and requires an access
									code
								</FieldDescription>
							</div>
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
							{isSubmitting ? 'Updating...' : 'Update Plan'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
