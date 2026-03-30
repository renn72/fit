'use client'

import * as React from 'react'

import { DocsLink } from '@/components/docs-link'
import { Button } from '@fit/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@fit/components/ui/field'
import { Input } from '@fit/components/ui/input'
import { Label } from '@fit/components/ui/label'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarInput,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '@fit/components/ui/sidebar'
import { Spinner } from '@fit/components/ui/spinner'
import { Textarea } from '@fit/components/ui/textarea'
import { TagsInput } from '@/components/ui-extended/tags-input'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import {
	formatIngredientPrecision,
	roundToIngredientPrecision,
} from '@/utils/ingredient-precision'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	DotsSixVerticalIcon,
	PlusIcon,
	SidebarIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { z } from 'zod'

const CATEGORY_SUGGESTIONS = ['breakfast', 'lunch', 'dinner', 'snack']
const TAG_SUGGESTIONS = ['high-protein', 'keto']

interface RecipeFormIngredient {
	id: string
	ingredientId: string
	amount: number
	unit: string
	altIngredientId: string
}

interface IngredientOption {
	id: string
	name: string
	category: string | null
	isBase: boolean
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
	serveUnit: string
	precision: number
}

interface RecipeFormValues {
	name: string
	description: string
	image: string
	categoryTags: string[]
	metaTags: string[]
	ingredients: RecipeFormIngredient[]
}

export interface RecipeFormProps {
	mode: 'create' | 'edit'
	organisationId: string
	recipeId?: string
	onSuccess?: () => void
}

const EDITED_FIELD_CLASS = 'ring-2 ring-primary/50'

const recipeFormSchema = z.object({
	name: z.string().min(1, 'Recipe name is required'),
	description: z.string(),
	image: z.string(),
	categoryTags: z.array(z.string()),
	metaTags: z.array(z.string()),
	ingredients: z.array(
		z.object({
			id: z.string().min(1),
			ingredientId: z.string().min(1),
			amount: z.number().positive(),
			unit: z.string().min(1),
			altIngredientId: z.string(),
		}),
	),
})

const EMPTY_RECIPE_FORM_VALUES: RecipeFormValues = {
	name: '',
	description: '',
	image: '',
	categoryTags: [],
	metaTags: [],
	ingredients: [],
}

function parseCsvToTags(value: string | null | undefined): string[] {
	if (!value) return []
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

function joinTagsToCsv(value: string[]): string {
	return value
		.map((item) => item.trim())
		.filter(Boolean)
		.join(',')
}

function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10
}

function normalizeText(value: string): string {
	return value.trim()
}

function normalizeName(value: string): string {
	return value.trim().toLowerCase()
}

function normalizeTags(value: string[]): string[] {
	return value.map((item) => item.trim()).filter(Boolean)
}

function toIngredientComboboxOptions(ingredients: IngredientOption[]) {
	return ingredients.map((ingredient) => ({
		value: ingredient.id,
		label: ingredient.category
			? `${ingredient.name} (${ingredient.category})`
			: ingredient.name,
	}))
}

export function RecipeForm({
	mode,
	organisationId,
	recipeId,
	onSuccess,
}: RecipeFormProps) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const { orgSlug } = useParams({ strict: false })
	const isEditMode = mode === 'edit'

	const { data: ingredientsData } = useSuspenseQuery(
		orpc.ingredient.getAllOrg.queryOptions({
			input: { organisationId },
		}),
	)

	const ingredients = (ingredientsData as IngredientOption[]) ?? []
	const ingredientMap = React.useMemo(
		() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
		[ingredients],
	)

	const { data: existingRecipe } = useQuery(
		orpc.recipe.get.queryOptions({
			input: { id: recipeId ?? '' },
			enabled: isEditMode && !!recipeId,
		}),
	)

	const recipesQueryOptions = orpc.recipe.getOrg.queryOptions({
		input: { organisationId },
	})
	const { data: orgRecipes } = useQuery(recipesQueryOptions)

	const { data: aiAccess } = useQuery(
		orpc.feature.getAiAccess.queryOptions({
			input: { organisationId },
		}),
	)
	const isAiEnabled =
		aiAccess?.effective.aiEnabled === true &&
		aiAccess?.effective.aiNutritionEnabled === true

	const initialFormValues = React.useMemo<RecipeFormValues | null>(() => {
		if (!isEditMode || !existingRecipe) return null
		return {
			name: existingRecipe.name,
			description: existingRecipe.description ?? '',
			image: existingRecipe.image ?? '',
			categoryTags: parseCsvToTags(existingRecipe.category),
			metaTags: parseCsvToTags(existingRecipe.metaTags),
			ingredients: (existingRecipe.ingredients ?? []).map((item) => ({
				id: item.id,
				ingredientId: item.ingredientId,
				amount: roundToIngredientPrecision(
					item.amount,
					item.ingredient?.precision,
				),
				unit: item.unit,
				altIngredientId: item.altIngredientId ?? '',
			})),
		}
	}, [existingRecipe, isEditMode])

	const createRecipe = useMutation(
		orpc.recipe.create.mutationOptions({
			onSuccess: () => {
				toast.success('Recipe created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.recipe.getOrg.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const updateRecipe = useMutation(
		orpc.recipe.update.mutationOptions({
			onSuccess: () => {
				toast.success('Recipe updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.recipe.getOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.recipe.get.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const form = useForm({
		defaultValues: EMPTY_RECIPE_FORM_VALUES,
		validators: {
			onSubmit: recipeFormSchema,
		},
		onSubmit: async ({ value }) => {
			const normalizedInputName = normalizeName(value.name)
			const recipesInOrg =
				orgRecipes ??
				(await queryClient.ensureQueryData(recipesQueryOptions)) ??
				[]

			const duplicateRecipe = recipesInOrg.some(
				(item) =>
					normalizeName(item.name) === normalizedInputName &&
					(!isEditMode || item.id !== recipeId),
			)

			if (duplicateRecipe) {
				toast.error(
					'A recipe with this name already exists in your organisation.',
				)
				return
			}

			const validIngredients = value.ingredients.filter(
				(item) => item.ingredientId && item.unit && item.amount > 0,
			)

			if (validIngredients.length === 0) {
				toast.error('Add at least one valid ingredient')
				return
			}

			const payload = {
				name: value.name.trim(),
				description: value.description.trim() || null,
				category: joinTagsToCsv(value.categoryTags) || null,
				image: value.image.trim() || null,
				metaTags: joinTagsToCsv(value.metaTags) || '',
				ingredients: validIngredients.map((item) => ({
					ingredientId: item.ingredientId,
					isBaseIngredient:
						ingredientMap.get(item.ingredientId)?.isBase ?? false,
					altIngredientId: item.altIngredientId || null,
					amount: roundToIngredientPrecision(
						item.amount,
						ingredientMap.get(item.ingredientId)?.precision,
					),
					unit: item.unit.trim(),
				})),
			}

			if (isEditMode) {
				if (!recipeId) return
				await updateRecipe.mutateAsync({
					id: recipeId,
					...payload,
				})
				return
			}

			await createRecipe.mutateAsync(payload)
		},
	})

	React.useEffect(() => {
		if (!initialFormValues) return
		form.setFieldValue('name', initialFormValues.name)
		form.setFieldValue('description', initialFormValues.description)
		form.setFieldValue('image', initialFormValues.image)
		form.setFieldValue('categoryTags', initialFormValues.categoryTags)
		form.setFieldValue('metaTags', initialFormValues.metaTags)
		form.setFieldValue('ingredients', initialFormValues.ingredients)
	}, [form, initialFormValues])

	const [ingredientSearch, setIngredientSearch] = React.useState('')
	const [activeDragId, setActiveDragId] = React.useState<string | null>(null)

	const updateRecipeWithAi = useMutation(
		orpc.ai.updateRecipeForm.mutationOptions({
			onSuccess: (data) => {
				form.setFieldValue('name', data.form.name)
				form.setFieldValue('description', data.form.description)
				form.setFieldValue('image', data.form.image)
				form.setFieldValue('categoryTags', data.form.categoryTags)
				form.setFieldValue('metaTags', data.form.metaTags)
				form.setFieldValue('ingredients', data.form.ingredients)
				toast.success('Recipe updated from AI request')
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const ingredientOptions = React.useMemo(
		() => toIngredientComboboxOptions(ingredients),
		[ingredients],
	)

	const filteredIngredients = React.useMemo(() => {
		const term = ingredientSearch.trim().toLowerCase()
		if (!term) return ingredients

		return ingredients.filter((ingredient) => {
			const nameMatch = ingredient.name.toLowerCase().includes(term)
			const categoryMatch = (ingredient.category ?? '')
				.toLowerCase()
				.includes(term)
			return nameMatch || categoryMatch
		})
	}, [ingredients, ingredientSearch])

	const initialIngredientsById = React.useMemo(() => {
		return new Map(
			(initialFormValues?.ingredients ?? []).map((ingredient) => [
				ingredient.id,
				ingredient,
			]),
		)
	}, [initialFormValues?.ingredients])

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const addIngredientById = React.useCallback(
		(ingredientId: string, insertIndex?: number) => {
			const ingredient = ingredientMap.get(ingredientId)
			if (!ingredient) return

			const newIngredient: RecipeFormIngredient = {
				id: crypto.randomUUID(),
				ingredientId,
				amount: roundToIngredientPrecision(
					ingredient.serveSize || 100,
					ingredient.precision,
				),
				unit: ingredient.serveUnit || 'g',
				altIngredientId: '',
			}

			const currentIngredients = form.getFieldValue('ingredients')
			if (
				insertIndex === undefined ||
				insertIndex < 0 ||
				insertIndex >= currentIngredients.length
			) {
				form.setFieldValue('ingredients', [
					...currentIngredients,
					newIngredient,
				])
				return
			}

			const next = [...currentIngredients]
			next.splice(insertIndex, 0, newIngredient)
			form.setFieldValue('ingredients', next)
		},
		[form, ingredientMap],
	)

	const updateIngredientField = React.useCallback(
		(id: string, field: keyof RecipeFormIngredient, value: string | number) => {
			const currentIngredients = form.getFieldValue('ingredients')
			form.setFieldValue(
				'ingredients',
				currentIngredients.map((item) => {
					if (item.id !== id) return item

					if (field === 'ingredientId' && typeof value === 'string') {
						const nextIngredient = ingredientMap.get(value)
						return {
							...item,
							ingredientId: value,
							amount: roundToIngredientPrecision(
								item.amount > 0
									? item.amount
									: (nextIngredient?.serveSize ?? item.amount),
								nextIngredient?.precision,
							),
							unit: nextIngredient?.serveUnit ?? item.unit,
						}
					}

					if (field === 'amount' && typeof value === 'number') {
						return {
							...item,
							amount: roundToIngredientPrecision(
								value,
								ingredientMap.get(item.ingredientId)?.precision,
							),
						}
					}

					return { ...item, [field]: value }
				}),
			)
		},
		[form, ingredientMap],
	)

	const removeIngredient = React.useCallback(
		(id: string) => {
			const currentIngredients = form.getFieldValue('ingredients')
			form.setFieldValue(
				'ingredients',
				currentIngredients.filter((item) => item.id !== id),
			)
		},
		[form],
	)

	const handleDragStart = (event: DragStartEvent) => {
		setActiveDragId(String(event.active.id))
	}

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveDragId(null)
		const activeId = String(event.active.id)
		const overId = event.over ? String(event.over.id) : null

		if (!overId) return

		const currentIngredients = form.getFieldValue('ingredients')

		if (activeId.startsWith('library-ingredient-')) {
			const ingredientId = activeId.replace('library-ingredient-', '')
			if (!ingredientMap.has(ingredientId)) return

			const insertIndex =
				overId === 'recipe-ingredients-droppable'
					? currentIngredients.length
					: currentIngredients.findIndex((item) => item.id === overId)

			addIngredientById(
				ingredientId,
				insertIndex === -1 ? currentIngredients.length : insertIndex,
			)
			return
		}

		const activeIndex = currentIngredients.findIndex(
			(item) => item.id === activeId,
		)
		const overIndex = currentIngredients.findIndex((item) => item.id === overId)

		if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
			return
		}

		form.setFieldValue(
			'ingredients',
			arrayMove(currentIngredients, activeIndex, overIndex),
		)
	}

	const handleAiRequest = React.useCallback(
		async (request: string) => {
			if (!isAiEnabled) {
				toast.error('AI features are not enabled for this organisation')
				return
			}

			const trimmedRequest = request.trim()
			if (!trimmedRequest) {
				toast.error('Enter a request for AI')
				return
			}

			await updateRecipeWithAi.mutateAsync({
				organisationId,
				request: trimmedRequest,
				currentForm: {
					name: form.getFieldValue('name'),
					description: form.getFieldValue('description'),
					image: form.getFieldValue('image'),
					categoryTags: form.getFieldValue('categoryTags'),
					metaTags: form.getFieldValue('metaTags'),
					ingredients: form.getFieldValue('ingredients'),
				},
			})
		},
		[form, isAiEnabled, organisationId, updateRecipeWithAi],
	)

	return (
		<SidebarProvider defaultOpen={false}>
			<div className='w-full'>
				<DndContext
					sensors={sensors}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<div className='flex gap-0 items-start w-full'>
						<div className='relative flex-1 min-w-0'>
							<form
								onSubmit={(event) => {
									event.preventDefault()
									event.stopPropagation()
									form.handleSubmit()
								}}
								className='flex flex-col gap-6 p-8'
							>
								<div className='flex justify-between items-center'>
									<h1 className='text-2xl font-bold'>
										{isEditMode ? 'Edit Recipe' : 'Create Recipe'}
									</h1>
									<div className='flex gap-2 items-center'>
										<DocsLink doc='createRecipes' label='Recipe Docs' />
										<SidebarTrigger size='default'>
											<Button
												render={<div />}
												nativeButton={false}
												className='cursor-pointer'
											>
												Ingredients
												<SidebarIcon />
											</Button>
										</SidebarTrigger>
									</div>
								</div>

								{isAiEnabled && (
									<Card>
										<CardHeader>
											<CardTitle>Ask AI</CardTitle>
											<CardDescription>
												Send a request and AI will update this recipe form.
											</CardDescription>
										</CardHeader>
										<CardContent className='space-y-3'>
											<AiRequestInput
												isPending={updateRecipeWithAi.isPending}
												onSend={handleAiRequest}
											/>
										</CardContent>
									</Card>
								)}

								<Card>
									<CardHeader>
										<CardTitle>Recipe Details</CardTitle>
										<CardDescription>
											Configure core details, categories, and tags.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<FieldGroup>
											<form.Field name='name'>
												{(field) => {
													const isInvalid =
														field.state.meta.isTouched &&
														field.state.meta.errors.length > 0
													const isEdited =
														isEditMode &&
														!!initialFormValues &&
														normalizeText(field.state.value) !==
															normalizeText(initialFormValues.name)

													return (
														<Field data-invalid={isInvalid}>
															<FieldLabel htmlFor={field.name}>
																Name *
															</FieldLabel>
															<Input
																id={field.name}
																name={field.name}
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(event) =>
																	field.handleChange(event.target.value)
																}
																placeholder='e.g., High Protein Chicken Bowl'
																className={isEdited ? EDITED_FIELD_CLASS : ''}
																required
															/>
															<FieldError errors={field.state.meta.errors} />
														</Field>
													)
												}}
											</form.Field>

											<form.Field name='description'>
												{(field) => {
													const isEdited =
														isEditMode &&
														!!initialFormValues &&
														normalizeText(field.state.value) !==
															normalizeText(initialFormValues.description)

													return (
														<Field>
															<FieldLabel htmlFor={field.name}>
																Description
															</FieldLabel>
															<Textarea
																id={field.name}
																name={field.name}
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(event) =>
																	field.handleChange(event.target.value)
																}
																placeholder='Describe the recipe and preparation notes...'
																className={`min-h-24 ${
																	isEdited ? EDITED_FIELD_CLASS : ''
																}`}
															/>
														</Field>
													)
												}}
											</form.Field>

											<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
												<form.Field name='categoryTags'>
													{(field) => {
														const isEdited =
															isEditMode &&
															!!initialFormValues &&
															JSON.stringify(
																normalizeTags(field.state.value),
															) !==
																JSON.stringify(
																	normalizeTags(initialFormValues.categoryTags),
																)

														return (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	Category
																</FieldLabel>
																<TagsInput
																	value={field.state.value}
																	onValueChange={field.handleChange}
																	suggestions={CATEGORY_SUGGESTIONS}
																	placeholder='Select or type categories...'
																	className={isEdited ? EDITED_FIELD_CLASS : ''}
																/>
															</Field>
														)
													}}
												</form.Field>

												<form.Field name='metaTags'>
													{(field) => {
														const isEdited =
															isEditMode &&
															!!initialFormValues &&
															JSON.stringify(
																normalizeTags(field.state.value),
															) !==
																JSON.stringify(
																	normalizeTags(initialFormValues.metaTags),
																)

														return (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	Tags
																</FieldLabel>
																<TagsInput
																	value={field.state.value}
																	onValueChange={field.handleChange}
																	suggestions={TAG_SUGGESTIONS}
																	placeholder='Select or type tags...'
																	className={isEdited ? EDITED_FIELD_CLASS : ''}
																/>
															</Field>
														)
													}}
												</form.Field>
											</div>

											<form.Field name='image'>
												{(field) => {
													const isEdited =
														isEditMode &&
														!!initialFormValues &&
														normalizeText(field.state.value) !==
															normalizeText(initialFormValues.image)

													return (
														<Field>
															<FieldLabel htmlFor={field.name}>
																Image URL
															</FieldLabel>
															<Input
																id={field.name}
																name={field.name}
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(event) =>
																	field.handleChange(event.target.value)
																}
																placeholder='https://example.com/recipe.jpg'
																className={isEdited ? EDITED_FIELD_CLASS : ''}
															/>
														</Field>
													)
												}}
											</form.Field>
										</FieldGroup>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<div className='flex justify-between items-center'>
											<div>
												<CardTitle>Ingredients</CardTitle>
												<CardDescription>
													Drag from sidebar, reorder by drag-handle, and tune
													amounts.
												</CardDescription>
											</div>
											<Button
												type='button'
												variant='outline'
												onClick={() => {
													const first = ingredients[0]
													if (!first) return
													addIngredientById(first.id)
												}}
											>
												<PlusIcon className='mr-2 size-4' />
												Add Row
											</Button>
										</div>
									</CardHeader>
									<CardContent className='space-y-4'>
										<form.Field name='ingredients'>
											{(field) => {
												const totals = field.state.value.reduce(
													(acc, item) => {
														const ingredient = ingredientMap.get(
															item.ingredientId,
														)
														if (!ingredient || ingredient.serveSize <= 0)
															return acc

														const ratio = item.amount / ingredient.serveSize
														acc.calories += ingredient.calories * ratio
														acc.protein += ingredient.protein * ratio
														acc.carbohydrate += ingredient.carbohydrate * ratio
														acc.fat += ingredient.fat * ratio
														return acc
													},
													{ calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
												)

												return (
													<>
														<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
															<MacroTile
																label='Calories'
																value={`${Math.round(totals.calories)} kcal`}
																className='bg-orange-50/80 dark:bg-orange-950/20'
															/>
															<MacroTile
																label='Protein'
																value={`${roundOneDecimal(totals.protein)} g`}
																className='bg-emerald-50/80 dark:bg-emerald-950/20'
															/>
															<MacroTile
																label='Carbs'
																value={`${roundOneDecimal(totals.carbohydrate)} g`}
																className='bg-blue-50/80 dark:bg-blue-950/20'
															/>
															<MacroTile
																label='Fat'
																value={`${roundOneDecimal(totals.fat)} g`}
																className='bg-pink-50/80 dark:bg-pink-950/20'
															/>
														</div>

														<IngredientsDroppable>
															{field.state.value.length === 0 ? (
																<div className='p-6 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
																	No ingredients yet. Drag ingredients from the
																	sidebar or add a row.
																</div>
															) : (
																<SortableContext
																	items={field.state.value.map(
																		(item) => item.id,
																	)}
																	strategy={verticalListSortingStrategy}
																>
																	<div className='space-y-3'>
																		{field.state.value.map((item) => (
																			<SortableIngredientRow
																				key={item.id}
																				item={item}
																				isEditMode={isEditMode}
																				initialItem={initialIngredientsById.get(
																					item.id,
																				)}
																				allIngredients={ingredients}
																				ingredientOptions={ingredientOptions}
																				ingredientMap={ingredientMap}
																				onUpdateField={updateIngredientField}
																				onRemove={removeIngredient}
																			/>
																		))}
																	</div>
																</SortableContext>
															)}
														</IngredientsDroppable>
													</>
												)
											}}
										</form.Field>
									</CardContent>
								</Card>

								<div className='flex gap-4 justify-end'>
									<Button
										type='button'
										variant='outline'
										onClick={() => {
											if (!orgSlug) return
											navigate({
												to: '/$orgSlug/recipes',
												params: { orgSlug },
											})
										}}
									>
										Cancel
									</Button>
									<Button
										type='submit'
										disabled={
											createRecipe.isPending ||
											updateRecipe.isPending ||
											updateRecipeWithAi.isPending
										}
									>
										{isEditMode
											? updateRecipe.isPending
												? 'Saving...'
												: 'Save Changes'
											: createRecipe.isPending
												? 'Creating...'
												: 'Create Recipe'}
									</Button>
								</div>
							</form>
							{updateRecipeWithAi.isPending ? (
								<div className='flex absolute inset-0 z-20 justify-center items-center bg-background/70 backdrop-blur-[1px]'>
									<div className='flex gap-2 items-center py-2 px-3 rounded-md border shadow-sm bg-card'>
										<Spinner className='size-4' />
										<span className='text-sm font-medium'>
											Applying AI updates...
										</span>
									</div>
								</div>
							) : null}
						</div>

						<IngredientSidebar
							ingredients={filteredIngredients}
							totalIngredients={ingredients.length}
							searchValue={ingredientSearch}
							onSearchChange={setIngredientSearch}
							onAddIngredient={(ingredientId) =>
								addIngredientById(ingredientId)
							}
						/>
					</div>

					<DragOverlay>
						{activeDragId?.startsWith('library-ingredient-') ? (
							<div className='p-3 text-sm rounded-md border shadow-md bg-card'>
								Dragging ingredient...
							</div>
						) : activeDragId ? (
							<div className='p-3 text-sm rounded-md border shadow-md bg-card'>
								Reordering ingredient...
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			</div>
		</SidebarProvider>
	)
}

const AiRequestInput = React.memo(function AiRequestInput({
	isPending,
	onSend,
}: {
	isPending: boolean
	onSend: (request: string) => Promise<void>
}) {
	const [request, setRequest] = React.useState('')

	const canSend = request.trim().length > 0 && !isPending

	const sendRequest = React.useCallback(async () => {
		const trimmedRequest = request.trim()
		if (!trimmedRequest || isPending) return

		try {
			await onSend(trimmedRequest)
			setRequest('')
		} catch {
			// Parent mutation already handles user-facing errors.
		}
	}, [isPending, onSend, request])

	return (
		<div className='flex gap-2 items-end'>
			<div className='flex-1 space-y-2'>
				<Label htmlFor='recipe-ai-request'>Request</Label>
				<Input
					id='recipe-ai-request'
					value={request}
					onChange={(event) => setRequest(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault()
							void sendRequest()
						}
					}}
					placeholder='e.g., make this 700 kcal, high-protein, and remove dairy'
				/>
			</div>
			<Button
				type='button'
				onClick={() => void sendRequest()}
				disabled={!canSend}
			>
				{isPending ? 'Sending...' : 'Send'}
			</Button>
		</div>
	)
})

function MacroTile({
	label,
	value,
	className,
}: {
	label: string
	value: string
	className?: string
}) {
	return (
		<div className={`p-2 rounded-lg border ${className ?? ''}`}>
			<div className='text-[11px] text-muted-foreground'>{label}</div>
			<div className='text-sm font-semibold'>{value}</div>
		</div>
	)
}

function IngredientsDroppable({ children }: { children: React.ReactNode }) {
	const { setNodeRef, isOver } = useDroppable({
		id: 'recipe-ingredients-droppable',
	})

	return (
		<div
			ref={setNodeRef}
			className={`rounded-lg p-1 transition-colors ${
				isOver ? 'bg-muted/40' : ''
			}`}
		>
			{children}
		</div>
	)
}

function SortableIngredientRow({
	item,
	isEditMode,
	initialItem,
	allIngredients,
	ingredientOptions,
	ingredientMap,
	onUpdateField,
	onRemove,
}: {
	item: RecipeFormIngredient
	isEditMode: boolean
	initialItem?: RecipeFormIngredient
	allIngredients: IngredientOption[]
	ingredientOptions: Array<{ value: string; label: string }>
	ingredientMap: Map<string, IngredientOption>
	onUpdateField: (
		id: string,
		field: keyof RecipeFormIngredient,
		value: string | number,
	) => void
	onRemove: (id: string) => void
}) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({
			id: item.id,
		})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	const selected = ingredientMap.get(item.ingredientId)
	const ratio =
		selected && selected.serveSize > 0 ? item.amount / selected.serveSize : 0
	const amountStep = formatIngredientPrecision(selected?.precision)
	const calories = selected ? roundOneDecimal(selected.calories * ratio) : 0
	const protein = selected ? roundOneDecimal(selected.protein * ratio) : 0
	const carbs = selected ? roundOneDecimal(selected.carbohydrate * ratio) : 0
	const fat = selected ? roundOneDecimal(selected.fat * ratio) : 0

	const isMainIngredientEdited = isEditMode
		? (initialItem?.ingredientId ?? '') !== item.ingredientId
		: false
	const isAltIngredientEdited = isEditMode
		? (initialItem?.altIngredientId ?? '') !== item.altIngredientId
		: false
	const isAmountEdited = isEditMode
		? roundToIngredientPrecision(
				initialItem?.amount ?? 0,
				selected?.precision,
			) !== roundToIngredientPrecision(item.amount, selected?.precision)
		: false
	const isUnitEdited = isEditMode
		? normalizeText(initialItem?.unit ?? '') !== normalizeText(item.unit)
		: false
	const isRowEdited =
		isMainIngredientEdited ||
		isAltIngredientEdited ||
		isAmountEdited ||
		isUnitEdited

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`p-4 space-y-4 rounded-lg border ${
				isRowEdited ? EDITED_FIELD_CLASS : ''
			}`}
		>
			<div className='flex gap-3 items-center'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					className='p-0 w-8 h-8 cursor-grab active:cursor-grabbing'
					{...attributes}
					{...listeners}
				>
					<DotsSixVerticalIcon className='size-4 text-muted-foreground' />
				</Button>
				<div className='grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2'>
					<div className='space-y-2'>
						<Label>Main Ingredient</Label>
						<div
							className={`rounded-md ${
								isMainIngredientEdited ? EDITED_FIELD_CLASS : ''
							}`}
						>
							<VirtualizedCombobox
								options={ingredientOptions}
								selectedOption={item.ingredientId}
								onSelectOption={(value) =>
									onUpdateField(item.id, 'ingredientId', value)
								}
								searchPlaceholder='Search ingredients...'
								width='100%'
								height='240px'
							/>
						</div>
					</div>
					<div className='space-y-2'>
						<Label>Alternative (Optional)</Label>
						<div
							className={`rounded-md ${
								isAltIngredientEdited ? EDITED_FIELD_CLASS : ''
							}`}
						>
							<VirtualizedCombobox
								options={ingredientOptions}
								selectedOption={item.altIngredientId}
								onSelectOption={(value) =>
									onUpdateField(item.id, 'altIngredientId', value)
								}
								searchPlaceholder='Search alternatives...'
								width='100%'
								height='240px'
							/>
						</div>
					</div>
				</div>
				<Button
					type='button'
					variant='ghost'
					size='icon'
					onClick={() => onRemove(item.id)}
				>
					<TrashIcon className='size-4 text-destructive' />
				</Button>
			</div>

			<div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
				<div className='space-y-2'>
					<Label>Amount</Label>
					<Input
						type='number'
						step={amountStep}
						value={item.amount}
						onChange={(event) =>
							onUpdateField(
								item.id,
								'amount',
								Number.parseFloat(event.target.value) || 0,
							)
						}
						placeholder='100'
						className={isAmountEdited ? EDITED_FIELD_CLASS : ''}
					/>
				</div>
				<div className='space-y-2'>
					<Label>Unit</Label>
					<Input
						value={item.unit}
						onChange={(event) =>
							onUpdateField(item.id, 'unit', event.target.value)
						}
						placeholder='g'
						className={isUnitEdited ? EDITED_FIELD_CLASS : ''}
					/>
				</div>
				<MacroTile label='Cal' value={`${calories}`} />
				<MacroTile label='Protein' value={`${protein} g`} />
			</div>

			<div className='grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 text-muted-foreground'>
				<div>Carbs: {carbs} g</div>
				<div>Fat: {fat} g</div>
				<div>
					Base serve: {selected?.serveSize ?? 0} {selected?.serveUnit ?? ''}
				</div>
				<div>
					{selected
						? `Step: ${formatIngredientPrecision(selected.precision)}${
								selected.category ? ` • ${selected.category}` : ''
							}`
						: ''}
				</div>
			</div>
		</div>
	)
}

function IngredientSidebar({
	ingredients,
	totalIngredients,
	searchValue,
	onSearchChange,
	onAddIngredient,
}: {
	ingredients: IngredientOption[]
	totalIngredients: number
	searchValue: string
	onSearchChange: (value: string) => void
	onAddIngredient: (ingredientId: string) => void
}) {
	return (
		<Sidebar
			side='right'
			collapsible='offcanvas'
			variant='sidebar'
			className='inset-y-auto border-l h-svh'
		>
			<SidebarHeader className='p-4 pb-3'>
				<p className='text-sm font-semibold'>Org Ingredients</p>
				<p className='text-xs text-muted-foreground'>
					{totalIngredients} ingredients. Drag into recipe rows.
				</p>
				<SidebarInput
					value={searchValue}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder='Search ingredients...'
				/>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className='p-3 pt-0'>
					<div className='space-y-2'>
						{ingredients.length === 0 ? (
							<p className='text-sm text-muted-foreground'>
								No ingredients match your search.
							</p>
						) : (
							ingredients.map((ingredient) => (
								<DraggableIngredientCard
									key={ingredient.id}
									ingredient={ingredient}
									onAdd={onAddIngredient}
								/>
							))
						)}
					</div>
				</SidebarGroup>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}

function DraggableIngredientCard({
	ingredient,
	onAdd,
}: {
	ingredient: IngredientOption
	onAdd: (ingredientId: string) => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `library-ingredient-${ingredient.id}`,
			data: {
				type: 'library-ingredient',
				ingredientId: ingredient.id,
			},
		})

	const style = {
		transform: CSS.Transform.toString(transform),
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`p-3 space-y-2 rounded-md border bg-card transition-all ${
				isDragging ? 'opacity-60' : ''
			}`}
		>
			<div className='flex gap-2 items-start'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					className='p-0 mt-0.5 w-8 h-8 cursor-grab active:cursor-grabbing'
					title='Drag into recipe'
					{...attributes}
					{...listeners}
				>
					<DotsSixVerticalIcon className='size-4 text-muted-foreground' />
				</Button>
				<div className='flex-1 min-w-0'>
					<p className='text-sm font-medium leading-tight truncate'>
						{ingredient.name}
					</p>
					<p className='text-xs text-muted-foreground'>
						{ingredient.category ? `${ingredient.category} • ` : ''}
						{Math.round(ingredient.calories)} cal per {ingredient.serveSize}
						{ingredient.serveUnit}
					</p>
				</div>
			</div>
			<Button
				type='button'
				variant='outline'
				size='sm'
				onClick={() => onAdd(ingredient.id)}
			>
				Add To Recipe
			</Button>
		</div>
	)
}
