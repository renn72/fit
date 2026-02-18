'use client'

import * as React from 'react'

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
import { useParams, useRouter } from '@tanstack/react-router'

import { toast } from 'sonner'

export interface RecipeCreateFormProps {
	organisationId: string
}

export function RecipeCreateForm({ organisationId }: RecipeCreateFormProps) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const { orgSlug } = useParams({ strict: false })
	const { data: orgIngredients } = useQuery(
		orpc.ingredient.getAllOrg.queryOptions({
			input: { organisationId },
		}),
	)
	const { data: baseIngredients } = useQuery(
		orpc.ingredient.getAllBase.queryOptions({
			input: {},
		}),
	)

	const createRecipe = useMutation(
		orpc.recipe.create.mutationOptions({
			onSuccess: () => {
				toast.success('Recipe created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.recipe.getOrg.key(),
				})
				if (!orgSlug) return
				router.navigate({
					to: '/$orgSlug/admin/s/recipes',
					params: { orgSlug },
				})
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const combinedIngredientOptions = React.useMemo(() => {
		const options: Array<{
			value: string
			label: string
			isBase: boolean
		}> = []
		if (baseIngredients) {
			options.push(
				...baseIngredients.map((ing) => ({
					value: ing.id,
					label: ing.name,
					isBase: true,
				})),
			)
		}
		if (orgIngredients) {
			options.push(
				...orgIngredients.map((ing) => ({
					value: ing.id,
					label: `${ing.name} (Org)`,
					isBase: false,
				})),
			)
		}
		return options
	}, [baseIngredients, orgIngredients])

	const form = useForm({
		defaultValues: {
			name: '',
			description: '',
			category: '',
			image: '',
			metaTags: '',
			ingredients: [] as Array<{
				ingredientId: string
				customIngredientId: string
				isBase: boolean
				altIngredientId: string
				altBaseIngredientId: string
				altIsBase: boolean
				amount: number
				unit: string
			}>,
		},
		onSubmit: async ({ value }) => {
			if (!value.name.trim()) {
				toast.error('Name is required')
				return
			}
			if (value.ingredients.length === 0) {
				toast.error('At least one ingredient is required')
				return
			}
			const validIngredients = value.ingredients.filter(
				(i) => (i.ingredientId || i.customIngredientId) && i.unit,
			)
			if (validIngredients.length === 0) {
				toast.error(
					'All ingredients must have an ingredient selected and a unit',
				)
				return
			}

			await createRecipe.mutateAsync({
				name: value.name,
				description: value.description || null,
				category: value.category || null,
				image: value.image || null,
				metaTags: value.metaTags || '',
				ingredients: validIngredients.map((ing) => ({
					ingredientId: ing.isBase ? ing.ingredientId || null : null,
					customIngredientId: ing.isBase
						? null
						: ing.customIngredientId || null,
					altIngredientId: ing.altIsBase ? ing.altIngredientId || null : null,
					altBaseIngredientId: ing.altIsBase
						? null
						: ing.altBaseIngredientId || null,
					amount: ing.amount,
					unit: ing.unit,
				})),
			})
		},
	})

	const addIngredient = () => {
		form.setFieldValue('ingredients', (prev) => [
			...prev,
			{
				ingredientId: '',
				customIngredientId: '',
				isBase: true,
				altIngredientId: '',
				altBaseIngredientId: '',
				altIsBase: true,
				amount: 0,
				unit: '',
			},
		])
	}

	const removeIngredient = (index: number) => {
		form.setFieldValue('ingredients', (prev) =>
			prev.filter((_, i) => i !== index),
		)
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				form.handleSubmit()
			}}
			className='flex flex-col gap-6 max-w-4xl'
		>
			<FieldGroup className='gap-6'>
				<div className='space-y-4'>
					<h2 className='text-lg font-semibold'>Recipe Details</h2>

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
									placeholder='e.g., Grilled Chicken Salad'
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
									placeholder='Describe your recipe...'
									className='min-h-24'
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<div className='grid grid-cols-2 gap-4'>
						<form.Field name='category'>
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Category</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder='e.g., Lunch, Dinner, Snack'
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name='metaTags'>
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Tags</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder='e.g., high-protein, gluten-free'
									/>
									<FieldDescription>Comma-separated tags</FieldDescription>
								</Field>
							)}
						</form.Field>
					</div>

					<form.Field name='image'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Image URL</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder='https://example.com/image.jpg'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<div className='space-y-4'>
					<div className='flex justify-between items-center'>
						<h2 className='text-lg font-semibold'>Ingredients</h2>
						<Button type='button' variant='outline' onClick={addIngredient}>
							Add Ingredient
						</Button>
					</div>

					<form.Field name='ingredients'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<div className='space-y-4'>
									{field.state.value.map((_, index) => (
										<div
											key={index}
											className='p-4 space-y-4 rounded-lg border'
										>
											<div className='flex gap-4 justify-between items-start'>
												<div className='flex-1 space-y-3'>
													<form.Field
														name={`ingredients[${index}].ingredientId`}
													>
														{(ingField) => (
															<Field>
																<FieldLabel>Ingredient</FieldLabel>
																<VirtualizedCombobox
																	options={combinedIngredientOptions}
																	selectedOption={
																		ingField.state.value ||
																		field.state.value[index]
																			?.customIngredientId ||
																		''
																	}
																	onSelectOption={(val) => {
																		const isBase =
																			combinedIngredientOptions.find(
																				(o) => o.value === val,
																			)?.isBase ?? true
																		form.setFieldValue(
																			`ingredients[${index}].isBase`,
																			isBase,
																		)
																		if (isBase) {
																			form.setFieldValue(
																				`ingredients[${index}].ingredientId`,
																				val,
																			)
																			form.setFieldValue(
																				`ingredients[${index}].customIngredientId`,
																				'',
																			)
																		} else {
																			form.setFieldValue(
																				`ingredients[${index}].ingredientId`,
																				'',
																			)
																			form.setFieldValue(
																				`ingredients[${index}].customIngredientId`,
																				val,
																			)
																		}
																	}}
																	searchPlaceholder='Search ingredients...'
																	width='100%'
																	height='200px'
																/>
															</Field>
														)}
													</form.Field>
												</div>
												<Button
													type='button'
													variant='ghost'
													size='sm'
													onClick={() => removeIngredient(index)}
												>
													Remove
												</Button>
											</div>

											<div className='grid grid-cols-3 gap-4'>
												<form.Field name={`ingredients[${index}].amount`}>
													{(amountField) => (
														<Field>
															<FieldLabel>Amount</FieldLabel>
															<Input
																type='number'
																step='0.01'
																value={amountField.state.value}
																onBlur={amountField.handleBlur}
																onChange={(e) =>
																	amountField.handleChange(
																		Number.parseFloat(e.target.value) || 0,
																	)
																}
																placeholder='e.g., 100'
															/>
														</Field>
													)}
												</form.Field>

												<form.Field name={`ingredients[${index}].unit`}>
													{(unitField) => (
														<Field>
															<FieldLabel>Unit</FieldLabel>
															<Input
																value={unitField.state.value}
																onBlur={unitField.handleBlur}
																onChange={(e) =>
																	unitField.handleChange(e.target.value)
																}
																placeholder='e.g., g, ml, cups'
															/>
														</Field>
													)}
												</form.Field>

												<form.Field
													name={`ingredients[${index}].altIngredientId`}
												>
													{(altField) => (
														<Field>
															<FieldLabel>Alternative (Optional)</FieldLabel>
															<VirtualizedCombobox
																options={combinedIngredientOptions}
																selectedOption={
																	altField.state.value ||
																	field.state.value[index]
																		?.altBaseIngredientId ||
																	''
																}
																onSelectOption={(val) => {
																	const isBase =
																		combinedIngredientOptions.find(
																			(o) => o.value === val,
																		)?.isBase ?? true
																	form.setFieldValue(
																		`ingredients[${index}].altIsBase`,
																		isBase,
																	)
																	if (isBase) {
																		form.setFieldValue(
																			`ingredients[${index}].altIngredientId`,
																			val,
																		)
																		form.setFieldValue(
																			`ingredients[${index}].altBaseIngredientId`,
																			'',
																		)
																	} else {
																		form.setFieldValue(
																			`ingredients[${index}].altIngredientId`,
																			'',
																		)
																		form.setFieldValue(
																			`ingredients[${index}].altBaseIngredientId`,
																			val,
																		)
																	}
																}}
																searchPlaceholder='Select alternative...'
																width='100%'
																height='300px'
															/>
														</Field>
													)}
												</form.Field>
											</div>
										</div>
									))}
									{field.state.value.length === 0 && (
										<p className='text-sm text-muted-foreground'>
											No ingredients added yet. Click "Add Ingredient" to start.
										</p>
									)}
								</div>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</div>
			</FieldGroup>

			<div className='flex gap-4 justify-end pt-4'>
				<Button
					type='button'
					variant='outline'
					onClick={() => {
						if (orgSlug) {
							router.navigate({
								to: '/$orgSlug/admin/s/recipes',
								params: { orgSlug },
							})
						}
					}}
				>
					Cancel
				</Button>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button type='submit' disabled={!canSubmit || isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create Recipe'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
