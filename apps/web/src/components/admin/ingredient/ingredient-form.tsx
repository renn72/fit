'use client'

import { Button } from '@/components/ui/button'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { TagsInput } from '@/components/ui-extended/tags-input'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

const ingredientFormSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	category: z.array(z.string()),
	calories: z.number().min(0),
	protein: z.number().min(0),
	fat: z.number().min(0),
	carbohydrate: z.number().min(0),
	serveSize: z.number().min(0),
	serveUnit: z.string().min(1, 'Unit is required'),
})

const CATEGORY_OPTIONS = ['High Protien', 'Keto', 'New', 'Plain']

export interface IngredientFormIngredient {
	id: string
	name: string
	category: string | null
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
	serveUnit: string
}

export interface IngredientFormProps {
	mode: 'create' | 'edit'
	ingredient?: IngredientFormIngredient
	onSuccess?: () => void
}

function splitCategories(value: string | null | undefined): string[] {
	if (!value) return []
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

function joinCategories(value: string[]): string | null {
	if (value.length === 0) return null
	const cleaned = value.map((item) => item.trim()).filter(Boolean)
	if (cleaned.length === 0) return null
	return cleaned.join(',')
}

function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10
}

export function IngredientForm({
	mode,
	ingredient,
	onSuccess,
}: IngredientFormProps) {
	const queryClient = useQueryClient()
	const isEditMode = mode === 'edit'

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

	const updateIngredient = useMutation(
		orpc.ingredient.update.mutationOptions({
			onSuccess: () => {
				toast.success('Ingredient updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.ingredient.getAllOrg.key(),
				})
				if (ingredient?.id) {
					queryClient.invalidateQueries({
						queryKey: orpc.ingredient.get.key(),
					})
				}
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const form = useForm({
		defaultValues: {
			name: ingredient?.name ?? '',
			category: splitCategories(ingredient?.category),
			calories: roundOneDecimal(ingredient?.calories ?? 0),
			protein: roundOneDecimal(ingredient?.protein ?? 0),
			fat: roundOneDecimal(ingredient?.fat ?? 0),
			carbohydrate: roundOneDecimal(ingredient?.carbohydrate ?? 0),
			serveSize: ingredient?.serveSize ?? 100,
			serveUnit: ingredient?.serveUnit ?? 'g',
		},
		validators: {
			onSubmit: ingredientFormSchema,
		},
		onSubmit: async ({ value }) => {
			const payload = {
				name: value.name,
				category: joinCategories(value.category),
				calories: roundOneDecimal(value.calories),
				protein: roundOneDecimal(value.protein),
				fat: roundOneDecimal(value.fat),
				carbohydrate: roundOneDecimal(value.carbohydrate),
				serveSize: value.serveSize,
				serveUnit: value.serveUnit,
			}

			if (isEditMode) {
				if (!ingredient?.id) return
				await updateIngredient.mutateAsync({
					id: ingredient.id,
					...payload,
				})
				return
			}

			await createIngredient.mutateAsync(payload)
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

				<form.Field name='category'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Category</FieldLabel>
							<TagsInput
								value={field.state.value}
								onValueChange={field.handleChange}
								suggestions={CATEGORY_OPTIONS}
								placeholder='Select or type category...'
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
									step='0.1'
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
									step='0.1'
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
									step='0.1'
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
									step='0.1'
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
									step='0.1'
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
							{isSubmitting
								? isEditMode
									? 'Updating...'
									: 'Creating...'
								: isEditMode
									? 'Update Ingredient'
									: 'Create Ingredient'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
