'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
	Field,
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

import { PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { z } from 'zod'

interface MealRecipe {
	recipeId: string
	recipeName: string
	recipeIndex: number
}

interface Meal {
	mealIndex: number
	name: string
	recipes: MealRecipe[]
}

const mealRecipeSchema = z.object({
	recipeId: z.string().min(1),
	recipeName: z.string().min(1),
	recipeIndex: z.number().int(),
})

const mealSchema = z.object({
	mealIndex: z.number().int(),
	name: z.string().min(1, 'Meal name is required'),
	recipes: z
		.array(mealRecipeSchema)
		.min(1, 'Each meal must have at least one recipe'),
})

const menuTemplateCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable(),
	category: z.string().nullable(),
	meals: z.array(mealSchema).min(1, 'At least one meal is required'),
})

export interface MenuTemplateCreateFormProps {
	organisationId: string
}

export function MenuTemplateCreateForm({
	organisationId,
}: MenuTemplateCreateFormProps) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const { orgSlug } = useParams({ strict: false })

	const { data: recipes } = useQuery(
		orpc.recipe.getOrg.queryOptions({
			input: { organisationId },
		}),
	)

	const createMenuTemplate = useMutation(
		orpc.menuTemplate.create.mutationOptions({
			onSuccess: () => {
				toast.success('Menu template created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.menuTemplate.getAllOrg.key(),
				})
				if (!orgSlug) return
				router.navigate({
					to: '/$orgSlug/menu-templates',
					params: { orgSlug },
				})
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const createMealMutation = useMutation(
		orpc.menuTemplate.createMeal.mutationOptions(),
	)

	const addRecipeMutation = useMutation(
		orpc.menuTemplate.addRecipe.mutationOptions(),
	)

	const recipeOptions = React.useMemo(() => {
		if (!recipes) return []
		return recipes.map((recipe) => ({
			value: recipe.id,
			label: recipe.name,
		}))
	}, [recipes])

	const form = useForm({
		defaultValues: {
			name: '',
			description: '' as string | null,
			category: '' as string | null,
			meals: [] as Meal[],
		},
		validators: {
			onSubmit: menuTemplateCreateSchema,
		},
		onSubmit: async ({ value }) => {
			// First create the menu template
			const menuTemplateData = await createMenuTemplate.mutateAsync({
				name: value.name,
				description: value.description || null,
				category: value.category || null,
			})

			// Then create each meal and add its recipes
			for (const meal of value.meals) {
				// Create the meal
				await createMealMutation.mutateAsync({
					menuTemplateId: menuTemplateData.id,
					mealIndex: meal.mealIndex,
					name: meal.name,
				})

				// Add all recipes for this meal
				for (const recipe of meal.recipes) {
					await addRecipeMutation.mutateAsync({
						menuTemplateId: menuTemplateData.id,
						recipeId: recipe.recipeId,
						mealIndex: meal.mealIndex,
						recipeIndex: recipe.recipeIndex,
					})
				}
			}
		},
	})

	const addMeal = () => {
		const currentMeals = form.getFieldValue('meals')
		const defaultName = `Meal ${currentMeals.length + 1}`
		form.setFieldValue('meals', [
			...currentMeals,
			{
				mealIndex: currentMeals.length,
				name: defaultName,
				recipes: [],
			},
		])
	}

	const removeMeal = (mealIndex: number) => {
		const currentMeals = form.getFieldValue('meals')
		const newMeals = currentMeals
			.filter((_, i) => i !== mealIndex)
			.map((meal, i) => ({ ...meal, mealIndex: i }))
		form.setFieldValue('meals', newMeals)
	}

	const updateMealName = (mealIndex: number, name: string) => {
		const currentMeals = form.getFieldValue('meals')
		const newMeals = [...currentMeals]
		if (newMeals[mealIndex]) {
			newMeals[mealIndex] = { ...newMeals[mealIndex], name }
			form.setFieldValue('meals', newMeals)
		}
	}

	const addRecipeToMeal = (mealIndex: number, recipeId: string) => {
		const recipe = recipes?.find((r) => r.id === recipeId)
		if (!recipe) return

		const currentMeals = form.getFieldValue('meals')
		const meal = currentMeals[mealIndex]
		if (!meal) return

		const newRecipe: MealRecipe = {
			recipeId,
			recipeName: recipe.name,
			recipeIndex: meal.recipes.length,
		}

		const newMeals = [...currentMeals]
		newMeals[mealIndex] = {
			...meal,
			recipes: [...meal.recipes, newRecipe],
		}

		form.setFieldValue('meals', newMeals)
	}

	const removeRecipeFromMeal = (mealIndex: number, recipeIndex: number) => {
		const currentMeals = form.getFieldValue('meals')
		const meal = currentMeals[mealIndex]
		if (!meal) return

		const newRecipes = meal.recipes
			.filter((_, i) => i !== recipeIndex)
			.map((r, i) => ({ ...r, recipeIndex: i }))

		const newMeals = [...currentMeals]
		newMeals[mealIndex] = {
			...meal,
			recipes: newRecipes,
		}

		form.setFieldValue('meals', newMeals)
	}

	const moveRecipeInMeal = (
		mealIndex: number,
		fromIndex: number,
		toIndex: number,
	) => {
		const currentMeals = form.getFieldValue('meals')
		const meal = currentMeals[mealIndex]
		if (!meal) return

		if (toIndex < 0 || toIndex >= meal.recipes.length) return

		const newRecipes = [...meal.recipes]
		const [movedRecipe] = newRecipes.splice(fromIndex, 1)
		newRecipes.splice(toIndex, 0, movedRecipe)

		// Update indices
		const reindexedRecipes = newRecipes.map((r, i) => ({
			...r,
			recipeIndex: i,
		}))

		const newMeals = [...currentMeals]
		newMeals[mealIndex] = {
			...meal,
			recipes: reindexedRecipes,
		}

		form.setFieldValue('meals', newMeals)
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
				{/* Basic Info */}
				<div className='space-y-4'>
					<h2 className='text-lg font-semibold'>Menu Template Details</h2>

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
									placeholder='e.g., Weekly Meal Plan - Weight Loss'
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
									placeholder='Optional description for this menu template...'
									className='min-h-20'
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name='category'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Category</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value || null)}
									placeholder='e.g., Weight Loss, Muscle Gain, Maintenance'
								/>
							</Field>
						)}
					</form.Field>
				</div>

				{/* Meals Section */}
				<div className='space-y-4 pt-4 border-t'>
					<div className='flex justify-between items-center'>
						<h2 className='text-lg font-semibold'>Meals</h2>
						<Button type='button' variant='outline' onClick={addMeal}>
							<PlusIcon className='mr-2 size-4' />
							Add Meal
						</Button>
					</div>

					<form.Field name='meals'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<div className='space-y-4'>
									{field.state.value.length === 0 ? (
										<div className='text-sm text-muted-foreground border rounded-md p-4 text-center'>
											No meals added yet. Click "Add Meal" to create your first
											meal.
										</div>
									) : (
										field.state.value.map((meal, mealIdx) => (
											<div
												key={mealIdx}
												className='p-4 space-y-4 rounded-lg border'
											>
												<div className='flex gap-4 justify-between items-start'>
													<div className='flex-1'>
														<span className='text-sm font-medium block mb-1.5'>
															Meal Name *
														</span>
														<Input
															value={meal.name}
															onChange={(e) =>
																updateMealName(mealIdx, e.target.value)
															}
															placeholder={`Meal ${mealIdx + 1}`}
														/>
													</div>
													<Button
														type='button'
														variant='ghost'
														size='sm'
														onClick={() => removeMeal(mealIdx)}
														className='text-red-500 mt-6'
													>
														<TrashIcon className='size-4' />
													</Button>
												</div>

												{/* Add Recipe to Meal */}
												<div className='space-y-2'>
													<span className='text-sm font-medium block'>
														Add Recipe
													</span>
													<VirtualizedCombobox
														options={recipeOptions}
														selectedOption=''
														onSelectOption={(val) => {
															if (val) addRecipeToMeal(mealIdx, val)
														}}
														searchPlaceholder='Search recipes...'
														width='100%'
														height='200px'
													/>
												</div>

												{/* Recipes in this Meal */}
												{meal.recipes.length > 0 && (
													<div className='space-y-2'>
														<div className='text-sm font-medium'>
															Recipes ({meal.recipes.length})
														</div>
														<div className='space-y-2'>
															{meal.recipes.map((recipe, recipeIdx) => (
																<div
																	key={`${recipe.recipeId}-${recipeIdx}`}
																	className='flex items-center gap-2 p-2 bg-muted rounded-md'
																>
																	<span className='text-muted-foreground w-6'>
																		{recipeIdx + 1}.
																	</span>
																	<span className='flex-1'>
																		{recipe.recipeName}
																	</span>
																	<div className='flex gap-1'>
																		<Button
																			type='button'
																			variant='ghost'
																			size='sm'
																			className='h-7 w-7 p-0'
																			onClick={() =>
																				moveRecipeInMeal(
																					mealIdx,
																					recipeIdx,
																					recipeIdx - 1,
																				)
																			}
																			disabled={recipeIdx === 0}
																		>
																			↑
																		</Button>
																		<Button
																			type='button'
																			variant='ghost'
																			size='sm'
																			className='h-7 w-7 p-0'
																			onClick={() =>
																				moveRecipeInMeal(
																					mealIdx,
																					recipeIdx,
																					recipeIdx + 1,
																				)
																			}
																			disabled={
																				recipeIdx === meal.recipes.length - 1
																			}
																		>
																			↓
																		</Button>
																		<Button
																			type='button'
																			variant='ghost'
																			size='sm'
																			className='h-7 w-7 p-0 text-red-500'
																			onClick={() =>
																				removeRecipeFromMeal(mealIdx, recipeIdx)
																			}
																		>
																			×
																		</Button>
																	</div>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										))
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
								to: '/$orgSlug/menu-templates',
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
							{isSubmitting ? 'Creating...' : 'Create Menu Template'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
