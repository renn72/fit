'use client'

import { Button } from '@/components/ui/button'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const ingredientCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	calories: z.number().min(0),
	protein: z.number().min(0),
	fat: z.number().min(0),
	carbohydrate: z.number().min(0),
	serveSize: z.number().min(0),
	serveUnit: z.string().min(1, 'Unit is required'),
})

export interface IngredientCreateFormProps {
	onSuccess?: () => void
}

export function IngredientCreateForm({ onSuccess }: IngredientCreateFormProps) {
	const queryClient = useQueryClient()

	const createIngredient = useMutation(
		orpc.ingredient.create.mutationOptions({
			onSuccess: () => {
				toast.success('Ingredient created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.ingredient.getAllOrg.key(),
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
			calories: 0,
			protein: 0,
			fat: 0,
			carbohydrate: 0,
			serveSize: 100,
			serveUnit: 'g',
		},
		validators: {
			onSubmit: ingredientCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createIngredient.mutateAsync({
				...value,
				calories: Math.round(value.calories * 10) / 10,
				protein: Math.round(value.protein * 10) / 10,
				fat: Math.round(value.fat * 10) / 10,
				carbohydrate: Math.round(value.carbohydrate * 10) / 10,
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
					<form.Field name='calories'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Calories</FieldLabel>
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

					<form.Field name='protein'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Protein (g)</FieldLabel>
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

					<form.Field name='carbohydrate'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Carbs (g)</FieldLabel>
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

					<form.Field name='fat'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Fat (g)</FieldLabel>
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

				<div className='grid grid-cols-2 gap-4'>
					<form.Field name='serveSize'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Serve Size</FieldLabel>
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

					<form.Field name='serveUnit'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Unit</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder='g, ml, etc.'
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
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
							{isSubmitting ? 'Creating...' : 'Create Ingredient'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
