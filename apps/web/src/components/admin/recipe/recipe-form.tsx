'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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
import { TagsInput } from '@/components/ui-extended/tags-input'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { orpc } from '@/utils/orpc'

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
}

interface RecipeFormState {
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

	const initialFormState = React.useMemo<RecipeFormState | null>(() => {
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
				amount: roundOneDecimal(item.amount),
				unit: item.unit,
				altIngredientId: item.altIngredientId ?? '',
			})),
		}
	}, [existingRecipe, isEditMode])

	const [ingredientSearch, setIngredientSearch] = React.useState('')
	const [activeDragId, setActiveDragId] = React.useState<string | null>(null)
	const [formState, setFormState] = React.useState<RecipeFormState>({
		name: '',
		description: '',
		image: '',
		categoryTags: [],
		metaTags: [],
		ingredients: [],
	})

	React.useEffect(() => {
		if (!initialFormState) return
		setFormState(initialFormState)
	}, [initialFormState])

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

	const recipeTotals = React.useMemo(() => {
		return formState.ingredients.reduce(
			(acc, item) => {
				const ingredient = ingredientMap.get(item.ingredientId)
				if (!ingredient || ingredient.serveSize <= 0) return acc

				const ratio = item.amount / ingredient.serveSize
				acc.calories += ingredient.calories * ratio
				acc.protein += ingredient.protein * ratio
				acc.carbohydrate += ingredient.carbohydrate * ratio
				acc.fat += ingredient.fat * ratio
				return acc
			},
			{ calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
		)
	}, [formState.ingredients, ingredientMap])

	const initialIngredientsById = React.useMemo(() => {
		return new Map(
			(initialFormState?.ingredients ?? []).map((ingredient) => [
				ingredient.id,
				ingredient,
			]),
		)
	}, [initialFormState?.ingredients])

	const isTopLevelFieldEdited = React.useCallback(
		(field: 'name' | 'description' | 'image' | 'categoryTags' | 'metaTags') => {
			if (!isEditMode || !initialFormState) return false

			switch (field) {
				case 'name':
					return (
						normalizeText(formState.name) !==
						normalizeText(initialFormState.name)
					)
				case 'description':
					return (
						normalizeText(formState.description) !==
						normalizeText(initialFormState.description)
					)
				case 'image':
					return (
						normalizeText(formState.image) !==
						normalizeText(initialFormState.image)
					)
				case 'categoryTags':
					return (
						JSON.stringify(normalizeTags(formState.categoryTags)) !==
						JSON.stringify(normalizeTags(initialFormState.categoryTags))
					)
				case 'metaTags':
					return (
						JSON.stringify(normalizeTags(formState.metaTags)) !==
						JSON.stringify(normalizeTags(initialFormState.metaTags))
					)
				default:
					return false
			}
		},
		[formState, initialFormState, isEditMode],
	)

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
				amount: roundOneDecimal(ingredient.serveSize || 100),
				unit: ingredient.serveUnit || 'g',
				altIngredientId: '',
			}

			setFormState((prev) => {
				if (
					insertIndex === undefined ||
					insertIndex >= prev.ingredients.length
				) {
					return {
						...prev,
						ingredients: [...prev.ingredients, newIngredient],
					}
				}

				const next = [...prev.ingredients]
				next.splice(insertIndex, 0, newIngredient)
				return { ...prev, ingredients: next }
			})
		},
		[ingredientMap],
	)

	const updateIngredientField = (
		id: string,
		field: keyof RecipeFormIngredient,
		value: string | number,
	) => {
		setFormState((prev) => ({
			...prev,
			ingredients: prev.ingredients.map((item) =>
				item.id === id ? { ...item, [field]: value } : item,
			),
		}))
	}

	const removeIngredient = (id: string) => {
		setFormState((prev) => ({
			...prev,
			ingredients: prev.ingredients.filter((item) => item.id !== id),
		}))
	}

	const handleDragStart = (event: DragStartEvent) => {
		setActiveDragId(String(event.active.id))
	}

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveDragId(null)
		const activeId = String(event.active.id)
		const overId = event.over ? String(event.over.id) : null

		if (!overId) return

		if (activeId.startsWith('library-ingredient-')) {
			const ingredientId = activeId.replace('library-ingredient-', '')
			if (!ingredientMap.has(ingredientId)) return

			const insertIndex =
				overId === 'recipe-ingredients-droppable'
					? formState.ingredients.length
					: formState.ingredients.findIndex((item) => item.id === overId)

			addIngredientById(
				ingredientId,
				insertIndex === -1 ? undefined : insertIndex,
			)
			return
		}

		const activeIndex = formState.ingredients.findIndex(
			(item) => item.id === activeId,
		)
		const overIndex = formState.ingredients.findIndex(
			(item) => item.id === overId,
		)

		if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
			return
		}

		setFormState((prev) => ({
			...prev,
			ingredients: arrayMove(prev.ingredients, activeIndex, overIndex),
		}))
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!formState.name.trim()) {
			toast.error('Recipe name is required')
			return
		}

		const validIngredients = formState.ingredients.filter(
			(item) => item.ingredientId && item.unit && item.amount > 0,
		)

		if (validIngredients.length === 0) {
			toast.error('Add at least one valid ingredient')
			return
		}

		const payload = {
			name: formState.name.trim(),
			description: formState.description.trim() || null,
			category: joinTagsToCsv(formState.categoryTags) || null,
			image: formState.image.trim() || null,
			metaTags: joinTagsToCsv(formState.metaTags) || '',
			ingredients: validIngredients.map((item) => ({
				ingredientId: item.ingredientId,
				isBaseIngredient: ingredientMap.get(item.ingredientId)?.isBase ?? false,
				altIngredientId: item.altIngredientId || null,
				amount: roundOneDecimal(item.amount),
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
	}

	return (
		<SidebarProvider defaultOpen={false}>
			<div className='w-full'>
				<DndContext
					sensors={sensors}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<div className='flex gap-0 items-start w-full'>
						<form
							onSubmit={handleSubmit}
							className='flex flex-col flex-1 gap-6 p-8 min-w-0'
						>
							<div className='flex justify-between items-center'>
								<h1 className='text-2xl font-bold'>
									{isEditMode ? 'Edit Recipe' : 'Create Recipe'}
								</h1>
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

							<Card>
								<CardHeader>
									<CardTitle>Recipe Details</CardTitle>
									<CardDescription>
										Configure core details, categories, and tags.
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									<div className='space-y-2'>
										<Label htmlFor='recipe-name'>Name *</Label>
										<Input
											id='recipe-name'
											value={formState.name}
											onChange={(event) =>
												setFormState((prev) => ({
													...prev,
													name: event.target.value,
												}))
											}
											placeholder='e.g., High Protein Chicken Bowl'
											className={
												isTopLevelFieldEdited('name') ? EDITED_FIELD_CLASS : ''
											}
											required
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='recipe-description'>Description</Label>
										<Textarea
											id='recipe-description'
											value={formState.description}
											onChange={(event) =>
												setFormState((prev) => ({
													...prev,
													description: event.target.value,
												}))
											}
											placeholder='Describe the recipe and preparation notes...'
											className={`min-h-24 ${
												isTopLevelFieldEdited('description')
													? EDITED_FIELD_CLASS
													: ''
											}`}
										/>
									</div>

									<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
										<div className='space-y-2'>
											<Label>Category</Label>
											<TagsInput
												value={formState.categoryTags}
												onValueChange={(value) =>
													setFormState((prev) => ({
														...prev,
														categoryTags: value,
													}))
												}
												suggestions={CATEGORY_SUGGESTIONS}
												placeholder='Select or type categories...'
												className={
													isTopLevelFieldEdited('categoryTags')
														? EDITED_FIELD_CLASS
														: ''
												}
											/>
										</div>
										<div className='space-y-2'>
											<Label>Tags</Label>
											<TagsInput
												value={formState.metaTags}
												onValueChange={(value) =>
													setFormState((prev) => ({
														...prev,
														metaTags: value,
													}))
												}
												suggestions={TAG_SUGGESTIONS}
												placeholder='Select or type tags...'
												className={
													isTopLevelFieldEdited('metaTags')
														? EDITED_FIELD_CLASS
														: ''
												}
											/>
										</div>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='recipe-image'>Image URL</Label>
										<Input
											id='recipe-image'
											value={formState.image}
											onChange={(event) =>
												setFormState((prev) => ({
													...prev,
													image: event.target.value,
												}))
											}
											placeholder='https://example.com/recipe.jpg'
											className={
												isTopLevelFieldEdited('image') ? EDITED_FIELD_CLASS : ''
											}
										/>
									</div>
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
									<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
										<MacroTile
											label='Calories'
											value={`${Math.round(recipeTotals.calories)} kcal`}
											className='bg-orange-50/80 dark:bg-orange-950/20'
										/>
										<MacroTile
											label='Protein'
											value={`${roundOneDecimal(recipeTotals.protein)} g`}
											className='bg-emerald-50/80 dark:bg-emerald-950/20'
										/>
										<MacroTile
											label='Carbs'
											value={`${roundOneDecimal(recipeTotals.carbohydrate)} g`}
											className='bg-blue-50/80 dark:bg-blue-950/20'
										/>
										<MacroTile
											label='Fat'
											value={`${roundOneDecimal(recipeTotals.fat)} g`}
											className='bg-pink-50/80 dark:bg-pink-950/20'
										/>
									</div>

									<IngredientsDroppable>
										{formState.ingredients.length === 0 ? (
											<div className='p-6 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
												No ingredients yet. Drag ingredients from the sidebar or
												add a row.
											</div>
										) : (
											<SortableContext
												items={formState.ingredients.map((item) => item.id)}
												strategy={verticalListSortingStrategy}
											>
												<div className='space-y-3'>
													{formState.ingredients.map((item) => (
														<SortableIngredientRow
															key={item.id}
															item={item}
															isEditMode={isEditMode}
															initialItem={initialIngredientsById.get(item.id)}
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
									disabled={createRecipe.isPending || updateRecipe.isPending}
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
		? roundOneDecimal(initialItem?.amount ?? 0) !== roundOneDecimal(item.amount)
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
								onSelectOption={(value) => {
									const ingredient = allIngredients.find((i) => i.id === value)
									onUpdateField(item.id, 'ingredientId', value)
									if (ingredient) {
										onUpdateField(item.id, 'unit', ingredient.serveUnit)
									}
								}}
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
						step='0.1'
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
				<div>{selected?.category ? `Category: ${selected.category}` : ''}</div>
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
