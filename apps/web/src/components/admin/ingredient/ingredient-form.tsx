'use client'

import { Button } from '@/components/ui/button'
import { DocsLink } from '@/components/docs-link'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { TagsInput } from '@/components/ui-extended/tags-input'
import {
	formatIngredientPrecision,
	normalizeIngredientPrecision,
} from '@/utils/ingredient-precision'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
	precision: z.number().positive('Precision must be greater than 0'),
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
	precision: number
}

export interface IngredientFormProps {
	mode: 'create' | 'edit'
	organisationId: string
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

function normalizeName(value: string): string {
	return value.trim().toLowerCase()
}

export function IngredientForm({
	mode,
	organisationId,
	ingredient,
	onSuccess,
}: IngredientFormProps) {
	const queryClient = useQueryClient()
	const isEditMode = mode === 'edit'
	const ingredientsQueryOptions = orpc.ingredient.getAllOrg.queryOptions({
		input: { organisationId },
	})

	const { data: orgIngredients } = useQuery(ingredientsQueryOptions)

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
			precision: normalizeIngredientPrecision(ingredient?.precision),
		},
		validators: {
			onSubmit: ingredientFormSchema,
		},
		onSubmit: async ({ value }) => {
			const normalizedInputName = normalizeName(value.name)
			const ingredientsInOrg =
				orgIngredients ??
				(await queryClient.ensureQueryData(ingredientsQueryOptions)) ??
				[]

			const duplicateIngredient = ingredientsInOrg.some(
				(item) =>
					normalizeName(item.name) === normalizedInputName &&
					(!isEditMode || item.id !== ingredient?.id),
			)

			if (duplicateIngredient) {
				toast.error(
					'An ingredient with this name already exists in your organisation.',
				)
				return
			}

			const payload = {
				name: value.name.trim(),
				category: joinCategories(value.category),
				calories: roundOneDecimal(value.calories),
				protein: roundOneDecimal(value.protein),
				fat: roundOneDecimal(value.fat),
				carbohydrate: roundOneDecimal(value.carbohydrate),
				serveSize: value.serveSize,
				serveUnit: value.serveUnit,
				precision: normalizeIngredientPrecision(value.precision),
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
			<div className='flex justify-end'>
				<DocsLink doc='createIngredients' label='Ingredient Form Docs' />
			</div>
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

				<form.Field name='precision'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Precision</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								type='number'
								step='any'
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(Number(e.target.value))}
								placeholder={formatIngredientPrecision(0.1)}
							/>
							<p className='text-xs text-muted-foreground'>
								Amount changes will move in steps of{' '}
								{formatIngredientPrecision(field.state.value || 0.1)}.
							</p>
							<FieldError errors={field.state.meta.errors} />
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
