'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarInput,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'

import {
	closestCorners,
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
	CaretDownIcon,
	CaretUpIcon,
	DotsSixVerticalIcon,
	PlusIcon,
	TrashIcon,
} from '@phosphor-icons/react'
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
		orpc.userMenu.createTemplate.mutationOptions({
			onSuccess: () => {
				toast.success('Menu template created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.userMenu.getTemplatesOrg.key(),
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

	const recipeOptions = React.useMemo(() => {
		if (!recipes) return []
		return recipes.map((recipe) => ({
			value: recipe.id,
			label: recipe.name,
		}))
	}, [recipes])

	const [expandedMeals, setExpandedMeals] = React.useState<Set<number>>(
		new Set(),
	)
	const [activeId, setActiveId] = React.useState<string | null>(null)
	const [recipeSearch, setRecipeSearch] = React.useState('')

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const filteredRecipes = React.useMemo(() => {
		if (!recipes) return []

		const term = recipeSearch.trim().toLowerCase()
		if (!term) return recipes

		return recipes.filter((recipe) => {
			const nameMatch = recipe.name.toLowerCase().includes(term)
			const categoryMatch = (recipe.category || '').toLowerCase().includes(term)
			const descriptionMatch = (recipe.description || '')
				.toLowerCase()
				.includes(term)
			return nameMatch || categoryMatch || descriptionMatch
		})
	}, [recipes, recipeSearch])

	const form = useForm({
		defaultValues: {
			name: '',
			description: '' as string | null,
			meals: [] as Meal[],
		},
		validators: {
			onSubmit: menuTemplateCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createMenuTemplate.mutateAsync({
				name: value.name,
				description: value.description || null,
				meals: value.meals.map((meal) => ({
					mealIndex: meal.mealIndex,
					name: meal.name,
					recipes: meal.recipes.map((recipe) => ({
						recipeId: recipe.recipeId,
						recipeIndex: recipe.recipeIndex,
					})),
				})),
			})
		},
	})

	const getRecipeDndId = React.useCallback(
		(mealIdx: number, recipeIdx: number, recipe: MealRecipe) =>
			`meal-recipe-${mealIdx}-${recipeIdx}-${recipe.recipeId}`,
		[],
	)

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
		setExpandedMeals((prev) => new Set([...prev, currentMeals.length]))
	}

	const removeMeal = (mealIndex: number) => {
		const currentMeals = form.getFieldValue('meals')
		const newMeals = currentMeals
			.filter((_, i) => i !== mealIndex)
			.map((meal, i) => ({ ...meal, mealIndex: i }))
		form.setFieldValue('meals', newMeals)
		setExpandedMeals((prev) => {
			const next = new Set<number>()
			for (const i of prev) {
				if (i < mealIndex) next.add(i)
				if (i > mealIndex) next.add(i - 1)
			}
			return next
		})
	}

	const moveMeal = (fromIndex: number, toIndex: number) => {
		const currentMeals = form.getFieldValue('meals')
		if (toIndex < 0 || toIndex >= currentMeals.length) return

		const nextMeals = [...currentMeals]
		const [movedMeal] = nextMeals.splice(fromIndex, 1)
		if (!movedMeal) return
		nextMeals.splice(toIndex, 0, movedMeal)

		form.setFieldValue(
			'meals',
			nextMeals.map((meal, index) => ({ ...meal, mealIndex: index })),
		)

		setExpandedMeals((prev) => {
			const next = new Set<number>()
			for (const i of prev) {
				if (i === fromIndex) next.add(toIndex)
				else if (fromIndex < toIndex && i > fromIndex && i <= toIndex)
					next.add(i - 1)
				else if (fromIndex > toIndex && i >= toIndex && i < fromIndex)
					next.add(i + 1)
				else next.add(i)
			}
			return next
		})
	}

	const toggleMealExpanded = (mealIndex: number) => {
		setExpandedMeals((prev) => {
			const next = new Set(prev)
			if (next.has(mealIndex)) {
				next.delete(mealIndex)
			} else {
				next.add(mealIndex)
			}
			return next
		})
	}

	const updateMealName = (mealIndex: number, name: string) => {
		const currentMeals = form.getFieldValue('meals')
		const newMeals = [...currentMeals]
		if (newMeals[mealIndex]) {
			newMeals[mealIndex] = { ...newMeals[mealIndex], name }
			form.setFieldValue('meals', newMeals)
		}
	}

	const addRecipeToMeal = (
		mealIndex: number,
		recipeId: string,
		insertAt?: number,
	) => {
		const recipe = recipes?.find((r) => r.id === recipeId)
		if (!recipe) return

		const currentMeals = form.getFieldValue('meals')
		const meal = currentMeals[mealIndex]
		if (!meal) return

		const targetIndex =
			insertAt === undefined
				? meal.recipes.length
				: Math.max(0, Math.min(insertAt, meal.recipes.length))

		const newRecipe: MealRecipe = {
			recipeId,
			recipeName: recipe.name,
			recipeIndex: targetIndex,
		}

		const newMeals = [...currentMeals]
		const newRecipes = [...meal.recipes]
		newRecipes.splice(targetIndex, 0, newRecipe)

		newMeals[mealIndex] = {
			...meal,
			recipes: newRecipes.map((r, i) => ({ ...r, recipeIndex: i })),
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

		const nextRecipes = arrayMove(meal.recipes, fromIndex, toIndex).map(
			(recipe, index) => ({ ...recipe, recipeIndex: index }),
		)

		const nextMeals = [...currentMeals]
		nextMeals[mealIndex] = { ...meal, recipes: nextRecipes }
		form.setFieldValue('meals', nextMeals)
	}

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string)
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		setActiveId(null)
		if (!over) return

		const activeData = active.data.current as
			| {
					type?: string
					mealIdx?: number
					recipeIdx?: number
					recipeId?: string
			  }
			| undefined
		const overData = over.data.current as
			| { type?: string; mealIdx?: number }
			| undefined

		const currentMeals = form.getFieldValue('meals')

		const resolveTarget = () => {
			let targetMealIdx = -1
			let targetRecipeIdx = -1

			if (overData?.type === 'meal-drop' && overData.mealIdx !== undefined) {
				targetMealIdx = overData.mealIdx
				targetRecipeIdx = currentMeals[targetMealIdx]?.recipes.length ?? -1
			} else {
				const overId = over.id as string
				for (let m = 0; m < currentMeals.length; m++) {
					for (let r = 0; r < currentMeals[m].recipes.length; r++) {
						if (getRecipeDndId(m, r, currentMeals[m].recipes[r]) === overId) {
							targetMealIdx = m
							targetRecipeIdx = r
							break
						}
					}
					if (targetMealIdx !== -1) break
				}
			}

			return { targetMealIdx, targetRecipeIdx }
		}

		if (activeData?.type === 'library-recipe') {
			const recipeId = activeData.recipeId
			if (!recipeId) return

			const { targetMealIdx, targetRecipeIdx } = resolveTarget()
			if (targetMealIdx < 0 || targetRecipeIdx < 0) return

			addRecipeToMeal(targetMealIdx, recipeId, targetRecipeIdx)
			return
		}

		if (activeData?.type !== 'meal-recipe') return
		if (
			activeData.mealIdx === undefined ||
			activeData.recipeIdx === undefined ||
			activeData.mealIdx < 0 ||
			activeData.recipeIdx < 0
		) {
			return
		}

		const sourceMealIdx = activeData.mealIdx
		const sourceRecipeIdx = activeData.recipeIdx

		const { targetMealIdx, targetRecipeIdx } = resolveTarget()
		if (
			targetMealIdx < 0 ||
			targetRecipeIdx < 0 ||
			sourceMealIdx >= currentMeals.length ||
			targetMealIdx >= currentMeals.length
		) {
			return
		}

		if (
			sourceMealIdx === targetMealIdx &&
			sourceRecipeIdx === targetRecipeIdx
		) {
			return
		}

		const nextMeals = currentMeals.map((meal) => ({
			...meal,
			recipes: [...meal.recipes],
		}))

		if (sourceMealIdx === targetMealIdx) {
			nextMeals[sourceMealIdx].recipes = arrayMove(
				nextMeals[sourceMealIdx].recipes,
				sourceRecipeIdx,
				targetRecipeIdx,
			)
		} else {
			const [movedRecipe] = nextMeals[sourceMealIdx].recipes.splice(
				sourceRecipeIdx,
				1,
			)
			if (!movedRecipe) return
			nextMeals[targetMealIdx].recipes.splice(targetRecipeIdx, 0, movedRecipe)
		}

		nextMeals[sourceMealIdx].recipes = nextMeals[sourceMealIdx].recipes.map(
			(recipe, index) => ({ ...recipe, recipeIndex: index }),
		)
		if (sourceMealIdx !== targetMealIdx) {
			nextMeals[targetMealIdx].recipes = nextMeals[targetMealIdx].recipes.map(
				(recipe, index) => ({ ...recipe, recipeIndex: index }),
			)
		}

		form.setFieldValue('meals', nextMeals)
	}

	return (
		<SidebarProvider defaultOpen={false}>
			<div className='flex flex-col gap-6 w-full min-h-svh'>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCorners}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<div className='flex gap-0 items-start w-full'>
						<form
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								form.handleSubmit()
							}}
							className='flex flex-col flex-1 gap-2 p-8 min-w-0'
						>
							<div className='flex justify-between items-center'>
								<h1 className='text-2xl font-bold'>Create Menu Template</h1>
								<SidebarTrigger className='hidden xl:inline-flex' />
							</div>
							<div className='flex justify-between items-center pb-4'>
								<Button
									onClick={() =>
										router.navigate({
											to: '/$orgSlug/menu-templates',
											params: { orgSlug: orgSlug || '' },
										})
									}
									variant='ghost'
									className='text-sm text-muted-foreground hover:text-foreground'
								>
									← Back to Menu Templates
								</Button>
							</div>
							<FieldGroup className='gap-6'>
								<div className='space-y-4'>
									<h2 className='text-lg font-semibold'>
										Menu Template Details
									</h2>

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
												<FieldLabel htmlFor={field.name}>
													Description
												</FieldLabel>
												<Textarea
													id={field.name}
													name={field.name}
													value={field.state.value ?? ''}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(e.target.value || null)
													}
													placeholder='Optional description for this menu template...'
													className='min-h-20'
												/>
											</Field>
										)}
									</form.Field>

								</div>

								<div className='pt-4 space-y-4 border-t'>
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
														<div className='p-4 text-sm text-center rounded-md border text-muted-foreground'>
															No meals added yet. Click "Add Meal" to create
															your first meal.
														</div>
													) : (
														field.state.value.map((meal, mealIdx) => {
															const isExpanded = expandedMeals.has(mealIdx)
															return (
														<div
															key={mealIdx}
															className='rounded-lg border'
														>
															<div
																		className='flex justify-between items-center p-4 cursor-pointer hover:bg-muted/50'
																		onMouseDown={() =>
																			toggleMealExpanded(mealIdx)
																		}
																	>
																<div className='flex gap-3 items-center'>
																			{isExpanded ? (
																				<CaretUpIcon className='size-4' />
																			) : (
																				<CaretDownIcon className='size-4' />
																			)}
																			<div>
																				<p className='font-medium'>
																					{meal.name}
																				</p>
																				<p className='text-xs text-muted-foreground'>
																					{meal.recipes.length} recipes
																				</p>
																			</div>
																</div>
																<div className='flex gap-1 items-center'>
																	<Button
																		type='button'
																		variant='ghost'
																		size='sm'
																		className='p-0 w-7 h-7'
																		onClick={(e) => {
																			e.stopPropagation()
																			moveMeal(mealIdx, mealIdx - 1)
																		}}
																		disabled={mealIdx === 0}
																	>
																		<CaretUpIcon className='size-3' />
																	</Button>
																	<Button
																		type='button'
																		variant='ghost'
																		size='sm'
																		className='p-0 w-7 h-7'
																		onClick={(e) => {
																			e.stopPropagation()
																			moveMeal(mealIdx, mealIdx + 1)
																		}}
																		disabled={mealIdx === field.state.value.length - 1}
																	>
																		<CaretDownIcon className='size-3' />
																	</Button>
																	<Button
																		type='button'
																		variant='ghost'
																		size='sm'
																		className='text-red-500'
																		onClick={(e) => {
																			e.stopPropagation()
																			removeMeal(mealIdx)
																		}}
																	>
																		<TrashIcon className='size-4' />
																	</Button>
																</div>
															</div>

																	{isExpanded && (
																		<div className='p-4 space-y-4 border-t'>
																			<div className='space-y-2'>
																				<Label>Meal Name *</Label>
																				<Input
																					value={meal.name}
																					onChange={(e) =>
																						updateMealName(
																							mealIdx,
																							e.target.value,
																						)
																					}
																					placeholder={`Meal ${mealIdx + 1}`}
																				/>
																			</div>

																			<div className='space-y-2'>
																				<Label className='text-sm font-medium'>
																					Add Recipe
																				</Label>
																				<VirtualizedCombobox
																					options={recipeOptions}
																					selectedOption=''
																					onSelectOption={(val) => {
																						if (val)
																							addRecipeToMeal(mealIdx, val)
																					}}
																					searchPlaceholder='Search recipes...'
																					width='100%'
																					height='200px'
																				/>
																			</div>

																			<RecipeDropZone
																				mealIdx={mealIdx}
																				recipes={meal.recipes}
																				getRecipeDndId={getRecipeDndId}
																			>
																				{meal.recipes.map(
																					(recipe, recipeIdx) => (
																						<DraggableTemplateRecipeCard
																							key={getRecipeDndId(
																								mealIdx,
																								recipeIdx,
																								recipe,
																							)}
																							recipe={recipe}
																							mealIdx={mealIdx}
																							recipeIdx={recipeIdx}
																							isFirst={recipeIdx === 0}
																							isLast={recipeIdx === meal.recipes.length - 1}
																							onMoveUp={() =>
																								moveRecipeInMeal(
																									mealIdx,
																									recipeIdx,
																									recipeIdx - 1,
																								)
																							}
																							onMoveDown={() =>
																								moveRecipeInMeal(
																									mealIdx,
																									recipeIdx,
																									recipeIdx + 1,
																								)
																							}
																							onRemove={() =>
																								removeRecipeFromMeal(
																									mealIdx,
																									recipeIdx,
																								)
																							}
																							getRecipeDndId={getRecipeDndId}
																						/>
																					),
																				)}
																			</RecipeDropZone>
																		</div>
																	)}
																</div>
															)
														})
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

						<TemplateRecipeSidebar
							recipes={filteredRecipes}
							totalRecipes={recipes?.length || 0}
							searchValue={recipeSearch}
							onSearchChange={setRecipeSearch}
							meals={form.getFieldValue('meals')}
							onAddToMeal={addRecipeToMeal}
						/>
					</div>

					<DragOverlay>
						{activeId ? (
							<TemplateRecipeOverlay
								recipe={(() => {
									const currentMeals = form.getFieldValue('meals')
									for (let m = 0; m < currentMeals.length; m++) {
										for (let r = 0; r < currentMeals[m].recipes.length; r++) {
											if (
												getRecipeDndId(m, r, currentMeals[m].recipes[r]) ===
												activeId
											) {
												return currentMeals[m].recipes[r]
											}
										}
									}
									return undefined
								})()}
								sourceRecipe={
									activeId.startsWith('library-recipe-')
										? recipes?.find(
												(recipe) =>
													recipe.id === activeId.replace('library-recipe-', ''),
											)
										: undefined
								}
							/>
						) : null}
					</DragOverlay>
				</DndContext>
			</div>
		</SidebarProvider>
	)
}

function RecipeDropZone({
	mealIdx,
	recipes,
	getRecipeDndId,
	children,
}: {
	mealIdx: number
	recipes: MealRecipe[]
	getRecipeDndId: (
		mealIdx: number,
		recipeIdx: number,
		recipe: MealRecipe,
	) => string
	children: React.ReactNode
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `meal-drop-${mealIdx}`,
		data: {
			type: 'meal-drop',
			mealIdx,
		},
	})

	return (
		<SortableContext
			items={recipes.map((recipe, idx) => getRecipeDndId(mealIdx, idx, recipe))}
			strategy={verticalListSortingStrategy}
		>
			<div
				ref={setNodeRef}
				className={`space-y-2 rounded-lg border-2 p-3 min-h-14 transition-all ${
					isOver
						? 'border-primary/60 bg-primary/10'
						: 'border-primary/25 bg-primary/5'
				}`}
			>
				{children}
			</div>
		</SortableContext>
	)
}

function DraggableTemplateRecipeCard({
	recipe,
	mealIdx,
	recipeIdx,
	isFirst,
	isLast,
	onMoveUp,
	onMoveDown,
	onRemove,
	getRecipeDndId,
}: {
	recipe: MealRecipe
	mealIdx: number
	recipeIdx: number
	isFirst: boolean
	isLast: boolean
	onMoveUp: () => void
	onMoveDown: () => void
	onRemove: () => void
	getRecipeDndId: (
		mealIdx: number,
		recipeIdx: number,
		recipe: MealRecipe,
	) => string
}) {
	const id = getRecipeDndId(mealIdx, recipeIdx, recipe)
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		data: {
			type: 'meal-recipe',
			mealIdx,
			recipeIdx,
			recipeId: recipe.recipeId,
		},
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex gap-2 items-center p-2 rounded-md border bg-card ${
				isDragging ? 'opacity-50 ring-2 ring-primary ring-offset-1' : ''
			}`}
		>
			<Button
				type='button'
				variant='ghost'
				size='sm'
				className='p-0 w-8 h-8 cursor-grab active:cursor-grabbing'
				title='Drag to reorder or move between meals'
				{...attributes}
				{...listeners}
			>
				<DotsSixVerticalIcon className='size-4 text-muted-foreground' />
			</Button>
			<span className='w-6 text-sm text-muted-foreground'>
				{recipeIdx + 1}.
			</span>
			<span className='flex-1 text-sm'>{recipe.recipeName}</span>
			<Button
				type='button'
				variant='ghost'
				size='sm'
				className='p-0 w-7 h-7'
				onClick={onMoveUp}
				disabled={isFirst}
				title='Move recipe up'
			>
				<CaretUpIcon className='size-3' />
			</Button>
			<Button
				type='button'
				variant='ghost'
				size='sm'
				className='p-0 w-7 h-7'
				onClick={onMoveDown}
				disabled={isLast}
				title='Move recipe down'
			>
				<CaretDownIcon className='size-3' />
			</Button>
			<Button
				type='button'
				variant='ghost'
				size='sm'
				className='p-0 w-8 h-8 text-red-500'
				onClick={onRemove}
			>
				<TrashIcon className='size-4' />
			</Button>
		</div>
	)
}

function TemplateRecipeSidebar({
	recipes,
	totalRecipes,
	searchValue,
	onSearchChange,
	meals,
	onAddToMeal,
}: {
	recipes: any[]
	totalRecipes: number
	searchValue: string
	onSearchChange: (value: string) => void
	meals: Meal[]
	onAddToMeal: (mealIndex: number, recipeId: string, insertAt?: number) => void
}) {
	return (
		<Sidebar
			side='right'
			collapsible='offcanvas'
			className='top-14 inset-y-auto border-l h-[calc(100svh-56px)]'
		>
			<SidebarHeader className='p-4 pb-3'>
				<p className='text-sm font-semibold'>Org Recipes</p>
				<p className='text-xs text-muted-foreground'>
					{totalRecipes} total recipes. Drag into any meal.
				</p>
				<SidebarInput
					value={searchValue}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder='Search recipes...'
				/>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className='p-3 pt-0'>
					<div className='space-y-2'>
						{recipes.length === 0 ? (
							<p className='text-sm text-muted-foreground'>
								No recipes match your search.
							</p>
						) : (
							recipes.map((recipe) => (
								<DraggableLibraryRecipeCard
									key={recipe.id}
									recipe={recipe}
									meals={meals}
									onAddToMeal={onAddToMeal}
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

function DraggableLibraryRecipeCard({
	recipe,
	meals,
	onAddToMeal,
}: {
	recipe: any
	meals: Meal[]
	onAddToMeal: (mealIndex: number, recipeId: string, insertAt?: number) => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `library-recipe-${recipe.id}`,
			data: {
				type: 'library-recipe',
				recipeId: recipe.id,
			},
		})

	const style = {
		transform: CSS.Transform.toString(transform),
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`rounded-md border bg-card p-2 space-y-2 ${
				isDragging ? 'opacity-0' : ''
			}`}
		>
			<div className='flex gap-2 items-start'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					className='p-0 w-8 h-8 cursor-grab active:cursor-grabbing'
					title='Drag into a meal'
					{...attributes}
					{...listeners}
				>
					<DotsSixVerticalIcon className='size-4 text-muted-foreground' />
				</Button>
				<div className='flex-1 min-w-0'>
					<p className='text-sm font-medium leading-tight truncate'>
						{recipe.name}
					</p>
					{recipe.category && (
						<p className='text-xs text-muted-foreground truncate'>
							{recipe.category}
						</p>
					)}
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button variant='outline' size='sm' />}>
					Add To
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-56'>
					{meals.length === 0 ? (
						<DropdownMenuItem disabled>Add a meal first</DropdownMenuItem>
					) : (
						meals.map((meal) => (
							<DropdownMenuItem
								key={`${meal.mealIndex}-${meal.name}`}
								onClick={() => onAddToMeal(meal.mealIndex, recipe.id)}
							>
								{meal.name}
							</DropdownMenuItem>
						))
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

function TemplateRecipeOverlay({
	recipe,
	sourceRecipe,
}: {
	recipe?: MealRecipe
	sourceRecipe?: any
}) {
	if (!recipe && !sourceRecipe) return null

	return (
		<div className='rounded-md border shadow-lg opacity-90 rotate-2 bg-card'>
			<div className='flex gap-2 items-center p-2 rounded-t-md bg-muted'>
				<CaretDownIcon className='size-4' />
				<span className='flex-1'>
					{recipe?.recipeName || sourceRecipe?.name || 'Recipe'}
				</span>
			</div>
		</div>
	)
}
