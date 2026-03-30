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
import { Input } from '@fit/components/ui/input'
import { Label } from '@fit/components/ui/label'
import { SidebarProvider, SidebarTrigger } from '@fit/components/ui/sidebar'
import { Spinner } from '@fit/components/ui/spinner'
import { Textarea } from '@fit/components/ui/textarea'
import {
	DEFAULT_INGREDIENT_PRECISION,
	normalizeIngredientPrecision,
	roundToIngredientPrecision,
} from '@/utils/ingredient-precision'
import { orpc } from '@/utils/orpc'
import {
	balanceRecipe,
	isValidSolution,
	selectIngredientsForBalancing,
} from '@/utils/recipe-balancer'

import { useForm, useStore } from '@tanstack/react-form'
import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { MealContent } from './meal-content'
import { MealHeader } from './meal-header'
import { calculateMealTotals } from './nutrition-utils'
import { OrgRecipeSidebar } from './org-recipe-sidebar'
import { RecipeCardOverlay } from './recipe-cards'
import type {
	Meal,
	MealIngredient,
	MealRecipe,
	MenuFormData,
	UserMenuFormProps,
} from './types'

import {
	closestCorners,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { PlusIcon, SidebarIcon } from '@phosphor-icons/react'
import _ from 'lodash'
import { toast } from 'sonner'

function getDateInputValue(date: Date): string {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
	return localDate.toISOString().split('T')[0]!
}

type AiMenuMode = 'fast' | 'thinking'

const AiMenuRequestInput = React.memo(function AiMenuRequestInput({
	isPending,
	mode,
	onModeChange,
	onSend,
}: {
	isPending: boolean
	mode: AiMenuMode
	onModeChange: (mode: AiMenuMode) => void
	onSend: (request: string, mode: AiMenuMode) => Promise<void>
}) {
	const [request, setRequest] = React.useState('')
	const canSend = request.trim().length > 0 && !isPending

	const sendRequest = React.useCallback(async () => {
		const trimmedRequest = request.trim()
		if (!trimmedRequest || isPending) return

		try {
			await onSend(trimmedRequest, mode)
			setRequest('')
		} catch {
			// Parent mutation handles user-facing errors.
		}
	}, [isPending, mode, onSend, request])

	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap gap-2 justify-between items-center'>
				<Label className='text-xs text-muted-foreground'>Mode</Label>
				<div className='inline-flex gap-1 p-1 rounded-md border bg-muted/30'>
					<Button
						type='button'
						size='sm'
						className='px-3 h-7'
						variant={mode === 'fast' ? 'default' : 'ghost'}
						onClick={() => onModeChange('fast')}
						disabled={isPending}
					>
						Fast
					</Button>
					<Button
						type='button'
						size='sm'
						className='px-3 h-7'
						variant={mode === 'thinking' ? 'default' : 'ghost'}
						onClick={() => onModeChange('thinking')}
						disabled={isPending}
					>
						Thinking
					</Button>
				</div>
			</div>
			<p className='text-xs text-muted-foreground'>
				{mode === 'fast'
					? 'Fast sends only your request + current form.'
					: 'Thinking sends your request + current form + org recipe and ingredient context.'}
			</p>
			<div className='flex gap-2 items-end'>
				<div className='flex-1 space-y-2'>
					<Label htmlFor='user-menu-ai-request'>Request</Label>
					<Input
						id='user-menu-ai-request'
						value={request}
						onChange={(event) => setRequest(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								void sendRequest()
							}
						}}
						placeholder='e.g., make this a 7-day high-protein plan with ~2200 kcal per day'
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
		</div>
	)
})

function getTodayDateString(): string {
	return getDateInputValue(new Date())
}

function roundToOneDecimal(value: number): number {
	return Math.round(value * 10) / 10
}

const EDITED_FIELD_CLASS = 'ring-2 ring-primary/50'

function normalizeText(value: string | null | undefined): string {
	return (value ?? '').trim()
}

function normalizeName(value: string | null | undefined): string {
	return normalizeText(value).toLowerCase()
}

function normalizeMealIngredientForCompare(ingredient: MealIngredient) {
	return {
		ingredientId: ingredient.ingredientId,
		ingredientName: normalizeText(ingredient.ingredientName),
		serveSize: roundToOneDecimal(ingredient.serveSize),
		serveUnit: normalizeText(ingredient.serveUnit),
		calories: roundToOneDecimal(ingredient.calories),
		protein: roundToOneDecimal(ingredient.protein),
		fat: roundToOneDecimal(ingredient.fat),
		carbohydrate: roundToOneDecimal(ingredient.carbohydrate),
	}
}

function normalizeMealRecipeForCompare(recipe: MealRecipe) {
	return {
		recipeName: normalizeText(recipe.recipeName),
		recipeIndex: recipe.recipeIndex,
		calories: roundToOneDecimal(recipe.calories),
		protein: roundToOneDecimal(recipe.protein),
		fat: roundToOneDecimal(recipe.fat),
		carbohydrate: roundToOneDecimal(recipe.carbohydrate),
		ingredients: recipe.ingredients.map(normalizeMealIngredientForCompare),
	}
}

function normalizeMealForCompare(meal: Meal) {
	return {
		mealIndex: meal.mealIndex,
		name: normalizeText(meal.name),
		targetCalories:
			meal.targetCalories === null
				? null
				: roundToOneDecimal(meal.targetCalories),
		targetProtein:
			meal.targetProtein === null
				? null
				: roundToOneDecimal(meal.targetProtein),
		recipes: meal.recipes.map(normalizeMealRecipeForCompare),
	}
}

function areMealsEqual(left: Meal, right: Meal): boolean {
	return _.isEqual(
		normalizeMealForCompare(left),
		normalizeMealForCompare(right),
	)
}

function areRecipesEqual(left: MealRecipe, right: MealRecipe): boolean {
	return _.isEqual(
		normalizeMealRecipeForCompare(left),
		normalizeMealRecipeForCompare(right),
	)
}

function getEmptyMenuFormData(): MenuFormData {
	return {
		name: '',
		description: null,
		startDate: getTodayDateString(),
		endDate: null,
		meals: [],
	}
}

export function UserMenuForm({
	userOrgId,
	menuId,
	orgSlug,
	user,
	mode = 'menu',
}: UserMenuFormProps) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// Determine if we're in edit mode
	const isEditMode = !!menuId
	const isTemplateMode = mode === 'template'
	const isUserMenuMode = mode === 'menu'
	const isTemplateEditMode = isTemplateMode && isEditMode
	const shouldHighlightEdits = isUserMenuMode || isTemplateEditMode

	const [selectedTemplate, setSelectedTemplate] = React.useState<any>(() =>
		isTemplateMode ? { id: null, isBlank: true } : null,
	)
	const [expandedMeals, setExpandedMeals] = React.useState<Set<number>>(
		new Set(),
	)
	const [expandedRecipes, setExpandedRecipes] = React.useState<Set<string>>(
		new Set(),
	)
	const [activeId, setActiveId] = React.useState<string | null>(null)
	const [recipeSearch, setRecipeSearch] = React.useState('')
	const [aiMode, setAiMode] = React.useState<AiMenuMode>('fast')

	// Sensors for dnd-kit
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

	const form = useForm({
		defaultValues: getEmptyMenuFormData(),
		onSubmit: async ({ value }) => {
			if (!isEditMode && !user) {
				toast.error(
					isTemplateMode
						? 'Unable to resolve template owner'
						: 'No user selected',
				)
				return
			}

			if (isTemplateMode) {
				const normalizedInputName = normalizeName(value.name)
				const duplicateTemplate = (menuTemplates ?? []).some(
					(template) =>
						normalizeName(template.name) === normalizedInputName &&
						(!isEditMode || template.id !== menuId),
				)

				if (duplicateTemplate) {
					toast.error(
						'A menu template with this name already exists in your organisation.',
					)
					return
				}
			}

			const meals = value.meals.map((meal) => {
				const recipeCount = meal.recipes.length
				const totalCalories = meal.recipes.reduce(
					(sum, recipe) => sum + recipe.calories,
					0,
				)
				const totalProtein = meal.recipes.reduce(
					(sum, recipe) => sum + recipe.protein,
					0,
				)
				const totalFat = meal.recipes.reduce(
					(sum, recipe) => sum + recipe.fat,
					0,
				)
				const totalCarbs = meal.recipes.reduce(
					(sum, recipe) => sum + recipe.carbohydrate,
					0,
				)

				const avgCalories = recipeCount > 0 ? totalCalories / recipeCount : 0
				const avgProtein = recipeCount > 0 ? totalProtein / recipeCount : 0
				const avgFat = recipeCount > 0 ? totalFat / recipeCount : 0
				const avgCarbs = recipeCount > 0 ? totalCarbs / recipeCount : 0

				return {
					mealIndex: meal.mealIndex,
					name: meal.name,
					calories: roundToOneDecimal(meal.targetCalories ?? avgCalories),
					protein: roundToOneDecimal(meal.targetProtein ?? avgProtein),
					fat: roundToOneDecimal(avgFat),
					carbohydrate: roundToOneDecimal(avgCarbs),
					recipes: meal.recipes.map((recipe) => ({
						recipeIndex: recipe.recipeIndex,
						name: recipe.recipeName,
						description: null,
						category: null,
						image: null,
						ingredients: recipe.ingredients.map((ingredient) => ({
							ingredientId: ingredient.ingredientId,
							serveSize: ingredient.serveSize,
							serveUnit: ingredient.serveUnit,
						})),
					})),
				}
			})

			if (isEditMode) {
				await batchUpdateMenuMutation.mutateAsync({
					id: menuId!,
					name: value.name,
					description: value.description,
					startDate: value.startDate ? new Date(value.startDate) : new Date(),
					endDate: value.endDate ? new Date(value.endDate) : null,
					meals,
				})
				return
			}

			await batchCreateMenuMutation.mutateAsync({
				userId: user!,
				menuTemplateId: isTemplateMode ? null : selectedTemplate?.id || null,
				name: value.name,
				description: value.description,
				startDate: isTemplateMode
					? null
					: value.startDate
						? new Date(value.startDate)
						: new Date(),
				endDate: isTemplateMode
					? null
					: value.endDate
						? new Date(value.endDate)
						: null,
				isTemplate: isTemplateMode,
				meals,
			})
		},
	})

	const formData = useStore(form.store, (state) => state.values as MenuFormData)
	const formDataRef = React.useRef(formData)
	React.useEffect(() => {
		formDataRef.current = formData
	}, [formData])
	const [initialFormSnapshot, setInitialFormSnapshot] =
		React.useState<MenuFormData | null>(null)

	const setFormData = React.useCallback(
		(
			nextOrUpdater: MenuFormData | ((prev: MenuFormData) => MenuFormData),
		): void => {
			const prev = form.state.values as MenuFormData
			const next =
				typeof nextOrUpdater === 'function'
					? nextOrUpdater(prev)
					: nextOrUpdater

			form.setFieldValue('name', next.name)
			form.setFieldValue('description', next.description)
			form.setFieldValue('startDate', next.startDate)
			form.setFieldValue('endDate', next.endDate)
			form.setFieldValue('meals', next.meals)
		},
		[form],
	)

	function resetToEmptyForm(): void {
		const nextFormData = getEmptyMenuFormData()
		setFormData(nextFormData)
		if (shouldHighlightEdits) {
			setInitialFormSnapshot(_.cloneDeep(nextFormData))
		}
	}

	// Load existing menu data when in edit mode
	const { data: existingMenu } = useQuery(
		orpc.userMenu.get.queryOptions({
			input: { id: menuId || '' },
			enabled: isEditMode,
		}),
	)

	// Transform existing menu data to form state when editing
	React.useEffect(() => {
		if (isEditMode && existingMenu) {
			const transformedMeals = existingMenu.meals.map((meal: any) => ({
				id: crypto.randomUUID(),
				mealIndex: meal.mealIndex,
				name: meal.name || `Meal ${meal.mealIndex + 1}`,
				targetCalories:
					meal.calories === null ? null : roundToOneDecimal(meal.calories),
				targetProtein:
					meal.protein === null ? null : roundToOneDecimal(meal.protein),
				recipes: existingMenu.recipes
					.filter((r: any) => r.mealIndex === meal.mealIndex)
					.sort((a: any, b: any) => a.recipeIndex - b.recipeIndex)
					.map((recipe: any) => {
						const recipeIngredients = existingMenu.ingredients
							.filter(
								(i: any) =>
									i.mealIndex === meal.mealIndex &&
									i.recipeIndex === recipe.recipeIndex,
							)
							.map((ing: any) => {
								const baseIng = ing.ingredient
								if (!baseIng) {
									return {
										id: crypto.randomUUID(),
										recipeToIngredientId: '',
										ingredientId: ing.ingredientId,
										ingredientName: 'Unknown',
										serveSize: ing.serveSize,
										serveUnit: ing.serveUnit,
										precision: DEFAULT_INGREDIENT_PRECISION,
										calories: 0,
										protein: 0,
										fat: 0,
										carbohydrate: 0,
									}
								}

								const normalizedServeSize = roundToIngredientPrecision(
									ing.serveSize,
									baseIng.precision,
								)
								const ratio = normalizedServeSize / baseIng.serveSize
								return {
									id: crypto.randomUUID(),
									recipeToIngredientId: '',
									ingredientId: ing.ingredientId,
									ingredientName: baseIng.name,
									serveSize: normalizedServeSize,
									serveUnit: ing.serveUnit,
									precision: normalizeIngredientPrecision(baseIng.precision),
									calories: baseIng.calories * ratio,
									protein: baseIng.protein * ratio,
									fat: baseIng.fat * ratio,
									carbohydrate: baseIng.carbohydrate * ratio,
								}
							})

						const recipeCalories = recipeIngredients.reduce(
							(sum: number, ing: MealIngredient) => sum + ing.calories,
							0,
						)
						const recipeProtein = recipeIngredients.reduce(
							(sum: number, ing: MealIngredient) => sum + ing.protein,
							0,
						)
						const recipeFat = recipeIngredients.reduce(
							(sum: number, ing: MealIngredient) => sum + ing.fat,
							0,
						)
						const recipeCarbs = recipeIngredients.reduce(
							(sum: number, ing: MealIngredient) => sum + ing.carbohydrate,
							0,
						)

						return {
							id: crypto.randomUUID(),
							recipeId: '',
							recipeName: recipe.name,
							recipeIndex: recipe.recipeIndex,
							calories: recipeCalories,
							protein: recipeProtein,
							fat: recipeFat,
							carbohydrate: recipeCarbs,
							ingredients: recipeIngredients,
						}
					}),
			}))

			const nextFormData: MenuFormData = {
				name: existingMenu.name,
				description: existingMenu.description,
				startDate: existingMenu.startDate
					? getDateInputValue(new Date(existingMenu.startDate))
					: getTodayDateString(),
				endDate: existingMenu.endDate
					? getDateInputValue(new Date(existingMenu.endDate))
					: null,
				meals: transformedMeals,
			}

			setFormData(nextFormData)
			setInitialFormSnapshot(_.cloneDeep(nextFormData))

			// Expand all meals and recipes for editing
			setExpandedMeals(new Set(transformedMeals.map((m: Meal) => m.mealIndex)))
			// setExpandedRecipes(
			// 	new Set(
			// 		transformedMeals.flatMap((m: Meal) =>
			// 			m.recipes.map((r: MealRecipe) => r.id),
			// 		),
			// 	),
			// )
		}
	}, [isEditMode, existingMenu, setFormData])

	const { data: menuTemplates } = useSuspenseQuery(
		orpc.userMenu.getTemplatesOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { data: recipes } = useQuery(
		orpc.recipe.getOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { data: ingredients } = useQuery(
		orpc.ingredient.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)
	const ingredientReferenceMap = React.useMemo(
		() =>
			new Map(
				(ingredients ?? []).map((ingredient) => [ingredient.id, ingredient]),
			),
		[ingredients],
	)

	const { data: aiAccess } = useQuery(
		orpc.feature.getAiAccess.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)
	const isAiEnabled =
		aiAccess?.effective.aiEnabled === true &&
		aiAccess?.effective.aiNutritionEnabled === true

	const batchCreateMenuMutation = useMutation(
		orpc.userMenu.batchCreate.mutationOptions({
			onSuccess: () => {
				if (isTemplateMode) {
					toast.success('Menu template created successfully')
					queryClient.invalidateQueries({
						queryKey: orpc.userMenu.getTemplatesOrg.key(),
					})
					navigate({
						to: '/$orgSlug/menu-templates',
						params: { orgSlug },
					})
					return
				}

				toast.success('Menu created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.userMenu.getByUser.key(),
				})
				navigate({
					to: '/$orgSlug/user-menu-create',
					params: { orgSlug: orgSlug },
				})
			},
			onError: (error) => {
				toast.error(
					error.message ||
						(isTemplateMode
							? 'Failed to create menu template'
							: 'Failed to create menu'),
				)
			},
		}),
	)

	const batchUpdateMenuMutation = useMutation(
		orpc.userMenu.batchUpdate.mutationOptions({
			onSuccess: () => {
				toast.success(
					isTemplateMode
						? 'Menu template updated successfully'
						: 'Menu updated successfully',
				)
				queryClient.invalidateQueries({
					queryKey: orpc.userMenu.getTemplatesOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.userMenu.getByUser.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.userMenu.get.key(),
				})

				if (isTemplateMode) {
					navigate({
						to: '/$orgSlug/menu-templates',
						params: { orgSlug },
					})
					return
				}

				navigate({
					to: '/$orgSlug/user-menus',
					params: { orgSlug },
					search: user ? { user } : {},
				})
			},
			onError: (error) => {
				toast.error(
					error.message ||
						(isTemplateMode
							? 'Failed to update menu template'
							: 'Failed to update menu'),
				)
			},
		}),
	)

	const updateUserMenuWithAi = useMutation(
		orpc.ai.updateUserMenuForm.mutationOptions({
			onSuccess: (data) => {
				setFormData(data.form)
				toast.success('Menu form updated from AI request')
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to apply AI update')
			},
		}),
	)

	const handleAiRequest = React.useCallback(
		async (request: string, mode: AiMenuMode) => {
			if (!isAiEnabled) {
				toast.error('AI features are not enabled for this organisation')
				return
			}

			const trimmedRequest = request.trim()
			if (!trimmedRequest) {
				toast.error('Enter a request for AI')
				return
			}

			await updateUserMenuWithAi.mutateAsync({
				organisationId: userOrgId,
				request: trimmedRequest,
				mode,
				currentForm: formDataRef.current,
			})
		},
		[isAiEnabled, updateUserMenuWithAi, userOrgId],
	)

	const recipeOptions = React.useMemo(() => {
		if (!recipes) return []
		return recipes.map((recipe) => ({
			value: recipe.id,
			label: recipe.name,
		}))
	}, [recipes])

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

	const ingredientOptions = React.useMemo(() => {
		if (!ingredients) return []
		return ingredients.map((ing) => ({
			value: ing.id,
			label: ing.name,
		}))
	}, [ingredients])

	const buildMealRecipeFromSource = React.useCallback(
		(recipe: any, recipeIndex: number): MealRecipe => {
			const recipeIngredients: MealIngredient[] = (
				recipe.ingredients || []
			).map((ing: any) => {
				const ingredientData = ing.ingredient
				if (!ingredientData) {
					return {
						id: crypto.randomUUID(),
						recipeToIngredientId: ing.id,
						ingredientId: ing.ingredientId,
						ingredientName: 'Unknown',
						serveSize: roundToIngredientPrecision(
							ing.amount,
							DEFAULT_INGREDIENT_PRECISION,
						),
						serveUnit: ing.unit,
						precision: DEFAULT_INGREDIENT_PRECISION,
						calories: 0,
						protein: 0,
						fat: 0,
						carbohydrate: 0,
					}
				}

				const multiplier =
					ingredientData.serveSize > 0
						? roundToIngredientPrecision(ing.amount, ingredientData.precision) /
							ingredientData.serveSize
						: 1

				return {
					id: crypto.randomUUID(),
					recipeToIngredientId: ing.id,
					ingredientId: ing.ingredientId,
					ingredientName: ingredientData.name,
					serveSize: roundToIngredientPrecision(
						ing.amount,
						ingredientData.precision,
					),
					serveUnit: ing.unit,
					precision: normalizeIngredientPrecision(ingredientData.precision),
					calories: ingredientData.calories * multiplier,
					protein: ingredientData.protein * multiplier,
					fat: ingredientData.fat * multiplier,
					carbohydrate: ingredientData.carbohydrate * multiplier,
				}
			})

			const recipeCalories = recipeIngredients.reduce(
				(sum, ing) => sum + ing.calories,
				0,
			)
			const recipeProtein = recipeIngredients.reduce(
				(sum, ing) => sum + ing.protein,
				0,
			)
			const recipeFat = recipeIngredients.reduce((sum, ing) => sum + ing.fat, 0)
			const recipeCarbs = recipeIngredients.reduce(
				(sum, ing) => sum + ing.carbohydrate,
				0,
			)

			return {
				id: crypto.randomUUID(),
				recipeId: recipe.id,
				recipeName: recipe.name,
				recipeIndex,
				calories: recipeCalories,
				protein: recipeProtein,
				fat: recipeFat,
				carbohydrate: recipeCarbs,
				ingredients: recipeIngredients,
			}
		},
		[],
	)

	const handleTemplateSelect = async (template: any) => {
		setSelectedTemplate(template)
		setExpandedMeals(new Set(template.meals.map((_: any, i: number) => i)))

		const initialMeals: Meal[] = template.meals.map((meal: any) => ({
			id: crypto.randomUUID(),
			mealIndex: meal.mealIndex,
			name: meal.name || `Meal ${meal.mealIndex + 1}`,
			targetCalories: null,
			targetProtein: null,
			recipes: [],
		}))

		for (const templateRecipe of template.recipes) {
			const meal = initialMeals.find(
				(m) => m.mealIndex === templateRecipe.mealIndex,
			)
			if (!meal) continue

			const recipeIngredients: MealIngredient[] = (template.ingredients || [])
				.filter(
					(ing: any) =>
						ing.mealIndex === templateRecipe.mealIndex &&
						ing.recipeIndex === templateRecipe.recipeIndex,
				)
				.map((ing: any) => {
					const ingredientData =
						ing.ingredient ||
						ingredients?.find((item: any) => item.id === ing.ingredientId)
					if (!ingredientData) {
						return {
							id: crypto.randomUUID(),
							recipeToIngredientId: '',
							ingredientId: ing.ingredientId,
							ingredientName: 'Unknown',
							serveSize: roundToIngredientPrecision(
								ing.serveSize,
								DEFAULT_INGREDIENT_PRECISION,
							),
							serveUnit: ing.serveUnit,
							precision: DEFAULT_INGREDIENT_PRECISION,
							calories: 0,
							protein: 0,
							fat: 0,
							carbohydrate: 0,
						}
					}

					const normalizedServeSize = roundToIngredientPrecision(
						ing.serveSize,
						ingredientData.precision,
					)
					const multiplier =
						ingredientData.serveSize > 0
							? normalizedServeSize / ingredientData.serveSize
							: 1

					return {
						id: crypto.randomUUID(),
						recipeToIngredientId: '',
						ingredientId: ing.ingredientId,
						ingredientName: ingredientData.name,
						serveSize: normalizedServeSize,
						serveUnit: ing.serveUnit,
						precision: normalizeIngredientPrecision(ingredientData.precision),
						calories: ingredientData.calories * multiplier,
						protein: ingredientData.protein * multiplier,
						fat: ingredientData.fat * multiplier,
						carbohydrate: ingredientData.carbohydrate * multiplier,
					}
				})

			const recipeCalories = recipeIngredients.reduce(
				(sum, ing) => sum + ing.calories,
				0,
			)
			const recipeProtein = recipeIngredients.reduce(
				(sum, ing) => sum + ing.protein,
				0,
			)
			const recipeFat = recipeIngredients.reduce((sum, ing) => sum + ing.fat, 0)
			const recipeCarbs = recipeIngredients.reduce(
				(sum, ing) => sum + ing.carbohydrate,
				0,
			)

			const mealRecipe: MealRecipe = {
				id: crypto.randomUUID(),
				recipeId: '',
				recipeName: templateRecipe.name,
				recipeIndex: templateRecipe.recipeIndex,
				calories: recipeCalories,
				protein: recipeProtein,
				fat: recipeFat,
				carbohydrate: recipeCarbs,
				ingredients: recipeIngredients,
			}

			meal.recipes.push(mealRecipe)
		}

		const nextFormData: MenuFormData = {
			name: template.name,
			description: template.description,
			startDate: getTodayDateString(),
			endDate: null,
			meals: initialMeals,
		}

		setFormData(nextFormData)
		if (shouldHighlightEdits) {
			setInitialFormSnapshot(_.cloneDeep(nextFormData))
		}
	}

	const addMeal = () => {
		const newMeal: Meal = {
			id: crypto.randomUUID(),
			mealIndex: formData.meals.length,
			name: `Meal ${formData.meals.length + 1}`,
			targetCalories: null,
			targetProtein: null,
			recipes: [],
		}
		setFormData((prev) => ({
			...prev,
			meals: [...prev.meals, newMeal],
		}))
		setExpandedMeals((prev) => new Set([...prev, newMeal.mealIndex]))
	}

	const removeMeal = (mealIndex: number) => {
		const newMeals = formData.meals
			.filter((_, i) => i !== mealIndex)
			.map((meal, i) => ({ ...meal, mealIndex: i }))
		setFormData((prev) => ({ ...prev, meals: newMeals }))
	}

	const updateMealName = (mealIndex: number, name: string) => {
		const newMeals = [...formData.meals]
		if (newMeals[mealIndex]) {
			newMeals[mealIndex] = { ...newMeals[mealIndex], name }
			setFormData((prev) => ({ ...prev, meals: newMeals }))
		}
	}

	const updateMealTargets = (
		mealIndex: number,
		field: 'targetCalories' | 'targetProtein',
		value: number | null,
	) => {
		const newMeals = [...formData.meals]
		if (newMeals[mealIndex]) {
			const normalizedValue =
				value === null || Number.isNaN(value) ? null : roundToOneDecimal(value)
			newMeals[mealIndex] = {
				...newMeals[mealIndex],
				[field]: normalizedValue,
			}
			setFormData((prev) => ({ ...prev, meals: newMeals }))
		}
	}

	const toggleMealExpanded = (mealIndex: number) => {
		setExpandedMeals((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(mealIndex)) {
				newSet.delete(mealIndex)
			} else {
				newSet.add(mealIndex)
			}
			return newSet
		})
	}

	const duplicateMeal = (mealIndex: number) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		// Deep clone the meal with new IDs for everything
		const duplicatedMeal: Meal = {
			...meal,
			id: crypto.randomUUID(),
			mealIndex: mealIndex + 1,
			name: `${meal.name} (Copy)`,
			recipes: meal.recipes.map((recipe) => ({
				...recipe,
				id: crypto.randomUUID(),
				ingredients: recipe.ingredients.map((ing) => ({
					...ing,
					id: crypto.randomUUID(),
				})),
			})),
		}

		// Insert the duplicated meal after the original
		const newMeals = [...formData.meals]
		newMeals.splice(mealIndex + 1, 0, duplicatedMeal)

		// Reindex all meals
		const reindexedMeals = newMeals.map((m, i) => ({ ...m, mealIndex: i }))

		setFormData((prev) => ({ ...prev, meals: reindexedMeals }))
		setExpandedMeals((prev) => new Set([...prev, mealIndex + 1]))
	}

	const moveMeal = (fromIndex: number, toIndex: number) => {
		if (toIndex < 0 || toIndex >= formData.meals.length) return

		const newMeals = [...formData.meals]
		const [movedMeal] = newMeals.splice(fromIndex, 1)
		newMeals.splice(toIndex, 0, movedMeal)

		// Reindex all meals
		const reindexedMeals = newMeals.map((m, i) => ({ ...m, mealIndex: i }))

		setFormData((prev) => ({ ...prev, meals: reindexedMeals }))
	}

	const addRecipeToMeal = (
		mealIndex: number,
		recipeId: string,
		insertAt?: number,
	) => {
		const recipe = recipes?.find((r) => r.id === recipeId)
		if (!recipe) return

		setFormData((prev) => {
			const meal = prev.meals[mealIndex]
			if (!meal) return prev

			const targetIndex =
				insertAt === undefined
					? meal.recipes.length
					: Math.max(0, Math.min(insertAt, meal.recipes.length))

			const newRecipe = buildMealRecipeFromSource(recipe, targetIndex)
			const nextRecipes = [...meal.recipes]
			nextRecipes.splice(targetIndex, 0, newRecipe)

			const reindexedRecipes = nextRecipes.map((item, index) => ({
				...item,
				recipeIndex: index,
			}))

			const newMeals = [...prev.meals]
			newMeals[mealIndex] = {
				...meal,
				recipes: reindexedRecipes,
			}

			return { ...prev, meals: newMeals }
		})

		// if (addedRecipeId) {
		// 	setExpandedRecipes((prev) => new Set([...prev, addedRecipeId!]))
		// }
	}

	const removeRecipeFromMeal = (mealIndex: number, recipeIndex: number) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		const newRecipes = meal.recipes
			.filter((_, i) => i !== recipeIndex)
			.map((r, i) => ({ ...r, recipeIndex: i }))

		const newMeals = [...formData.meals]
		newMeals[mealIndex] = { ...meal, recipes: newRecipes }

		setFormData((prev) => ({ ...prev, meals: newMeals }))
	}

	const duplicateRecipe = (mealIndex: number, recipeIndex: number) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		const recipe = meal.recipes[recipeIndex]
		if (!recipe) return

		// Deep clone the recipe with new IDs
		const duplicatedRecipe: MealRecipe = {
			...recipe,
			id: crypto.randomUUID(),
			recipeIndex: recipeIndex + 1,
			recipeName: `${recipe.recipeName} (Copy)`,
			ingredients: recipe.ingredients.map((ing) => ({
				...ing,
				id: crypto.randomUUID(),
			})),
		}

		// Insert the duplicated recipe after the original
		const newRecipes = [...meal.recipes]
		newRecipes.splice(recipeIndex + 1, 0, duplicatedRecipe)

		// Reindex all recipes
		const reindexedRecipes = newRecipes.map((r, i) => ({
			...r,
			recipeIndex: i,
		}))

		const newMeals = [...formData.meals]
		newMeals[mealIndex] = { ...meal, recipes: reindexedRecipes }

		setFormData((prev) => ({ ...prev, meals: newMeals }))
		setExpandedRecipes((prev) => new Set([...prev, duplicatedRecipe.id]))
	}

	// Handle drag start
	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string)
	}

	// Handle drag over (for visual feedback)
	const handleDragOver = (event: DragOverEvent) => {
		// Optional: Add visual feedback during drag
		const { over } = event
		if (!over) return
	}

	// Handle drag end for moving recipes between meals and reordering
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		setActiveId(null)

		if (!over) return

		const activeId = active.id as string
		const overId = over.id as string

		const activeData = active.data.current as
			| {
					type?: string
					mealIdx?: number
					recipeIdx?: number
					recipeId?: string
			  }
			| undefined

		if (activeData?.type === 'library-recipe') {
			const sourceRecipe = recipes?.find(
				(recipe) => recipe.id === activeData.recipeId,
			)
			if (!sourceRecipe) return

			let addedRecipeId: string | null = null

			setFormData((prev) => {
				let targetMealIdx = -1
				let targetRecipeIdx = -1

				const overData = over.data.current as
					| { type?: string; mealIdx?: number }
					| undefined

				if (overData?.type === 'meal-drop' && overData.mealIdx !== undefined) {
					targetMealIdx = overData.mealIdx
					targetRecipeIdx = prev.meals[targetMealIdx]?.recipes.length ?? -1
				} else {
					for (let i = 0; i < prev.meals.length; i++) {
						const recipeIdx = prev.meals[i].recipes.findIndex(
							(recipe) => recipe.id === overId,
						)
						if (recipeIdx !== -1) {
							targetMealIdx = i
							targetRecipeIdx = recipeIdx
							break
						}
					}
				}

				if (
					targetMealIdx < 0 ||
					targetRecipeIdx < 0 ||
					targetMealIdx >= prev.meals.length
				) {
					return prev
				}

				const targetMeal = prev.meals[targetMealIdx]
				if (!targetMeal) return prev

				const newRecipe = buildMealRecipeFromSource(
					sourceRecipe,
					targetRecipeIdx,
				)
				addedRecipeId = newRecipe.id

				const nextRecipes = [...targetMeal.recipes]
				nextRecipes.splice(targetRecipeIdx, 0, newRecipe)

				const reindexedRecipes = nextRecipes.map((item, index) => ({
					...item,
					recipeIndex: index,
				}))

				const nextMeals = [...prev.meals]
				nextMeals[targetMealIdx] = {
					...targetMeal,
					recipes: reindexedRecipes,
				}

				return { ...prev, meals: nextMeals }
			})

			if (addedRecipeId) {
				setExpandedRecipes((prev) => new Set([...prev, addedRecipeId!]))
			}
			return
		}

		setFormData((prev) => {
			// Resolve source recipe location.
			let sourceMealIdx = -1
			let sourceRecipeIdx = -1

			if (
				activeData?.type === 'meal-recipe' &&
				activeData.mealIdx !== undefined &&
				activeData.recipeIdx !== undefined
			) {
				const possibleRecipe =
					prev.meals[activeData.mealIdx]?.recipes[activeData.recipeIdx]
				if (possibleRecipe?.id === activeId) {
					sourceMealIdx = activeData.mealIdx
					sourceRecipeIdx = activeData.recipeIdx
				}
			}

			if (sourceMealIdx < 0 || sourceRecipeIdx < 0) {
				for (let i = 0; i < prev.meals.length; i++) {
					const recipeIdx = prev.meals[i].recipes.findIndex(
						(recipe) => recipe.id === activeId,
					)
					if (recipeIdx !== -1) {
						sourceMealIdx = i
						sourceRecipeIdx = recipeIdx
						break
					}
				}
			}

			if (sourceMealIdx < 0 || sourceRecipeIdx < 0) return prev

			// Resolve target location.
			let targetMealIdx = -1
			let targetRecipeIdx = -1

			const overData = over.data.current as
				| { type?: string; mealIdx?: number }
				| undefined

			if (overData?.type === 'meal-drop' && overData.mealIdx !== undefined) {
				targetMealIdx = overData.mealIdx
				targetRecipeIdx = prev.meals[targetMealIdx]?.recipes.length ?? -1
			} else {
				for (let i = 0; i < prev.meals.length; i++) {
					const recipeIdx = prev.meals[i].recipes.findIndex(
						(recipe) => recipe.id === overId,
					)
					if (recipeIdx !== -1) {
						targetMealIdx = i
						targetRecipeIdx = recipeIdx
						break
					}
				}
			}

			if (
				targetMealIdx < 0 ||
				targetRecipeIdx < 0 ||
				targetMealIdx >= prev.meals.length ||
				sourceMealIdx >= prev.meals.length
			) {
				return prev
			}

			// Don't do anything if dropped on itself.
			if (
				sourceMealIdx === targetMealIdx &&
				sourceRecipeIdx === targetRecipeIdx
			) {
				return prev
			}

			const newMeals = prev.meals.map((meal) => ({
				...meal,
				recipes: [...meal.recipes],
			}))

			if (sourceMealIdx === targetMealIdx) {
				newMeals[sourceMealIdx].recipes = arrayMove(
					newMeals[sourceMealIdx].recipes,
					sourceRecipeIdx,
					targetRecipeIdx,
				)
			} else {
				const [movedRecipe] = newMeals[sourceMealIdx].recipes.splice(
					sourceRecipeIdx,
					1,
				)
				if (!movedRecipe) return prev

				newMeals[targetMealIdx].recipes.splice(targetRecipeIdx, 0, movedRecipe)
			}

			const affectedMeals = new Set([sourceMealIdx, targetMealIdx])
			for (const mealIdx of affectedMeals) {
				newMeals[mealIdx].recipes = newMeals[mealIdx].recipes.map(
					(recipe, recipeIndex) => ({
						...recipe,
						recipeIndex,
					}),
				)
			}

			return { ...prev, meals: newMeals }
		})
	}

	const toggleRecipeExpanded = (recipeId: string) => {
		setExpandedRecipes((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(recipeId)) {
				newSet.delete(recipeId)
			} else {
				newSet.add(recipeId)
			}
			return newSet
		})
	}

	const getMealIngredientPrecision = React.useCallback(
		(ingredient: Pick<MealIngredient, 'ingredientId' | 'precision'>) =>
			normalizeIngredientPrecision(
				ingredientReferenceMap.get(ingredient.ingredientId)?.precision ??
					ingredient.precision,
			),
		[ingredientReferenceMap],
	)

	const recalculateMealIngredient = React.useCallback(
		(
			ingredient: MealIngredient,
			requestedServeSize: number,
		): MealIngredient => {
			const precision = getMealIngredientPrecision(ingredient)
			const nextServeSize = roundToIngredientPrecision(
				Math.max(0, requestedServeSize),
				precision,
			)
			const referenceIngredient = ingredientReferenceMap.get(
				ingredient.ingredientId,
			)

			if (referenceIngredient && referenceIngredient.serveSize > 0) {
				const ratio = nextServeSize / referenceIngredient.serveSize
				return {
					...ingredient,
					ingredientName: referenceIngredient.name,
					serveUnit: referenceIngredient.serveUnit,
					precision,
					serveSize: nextServeSize,
					calories: roundToOneDecimal(referenceIngredient.calories * ratio),
					protein: roundToOneDecimal(referenceIngredient.protein * ratio),
					fat: roundToOneDecimal(referenceIngredient.fat * ratio),
					carbohydrate: roundToOneDecimal(
						referenceIngredient.carbohydrate * ratio,
					),
				}
			}

			const ratio =
				ingredient.serveSize > 0 ? nextServeSize / ingredient.serveSize : 0

			return {
				...ingredient,
				precision,
				serveSize: nextServeSize,
				calories: roundToOneDecimal(ingredient.calories * ratio),
				protein: roundToOneDecimal(ingredient.protein * ratio),
				fat: roundToOneDecimal(ingredient.fat * ratio),
				carbohydrate: roundToOneDecimal(ingredient.carbohydrate * ratio),
			}
		},
		[getMealIngredientPrecision, ingredientReferenceMap],
	)

	const updateIngredientServeSize = (
		mealIndex: number,
		recipeIndex: number,
		ingredientIndex: number,
		serveSize: number,
	) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		const recipe = meal.recipes[recipeIndex]
		if (!recipe) return

		const ingredient = recipe.ingredients[ingredientIndex]
		if (!ingredient) return

		const newIngredients = [...recipe.ingredients]
		newIngredients[ingredientIndex] = recalculateMealIngredient(
			ingredient,
			serveSize,
		)

		// Recalculate recipe totals
		const newRecipeCalories = newIngredients.reduce(
			(sum, ing) => sum + ing.calories,
			0,
		)
		const newRecipeProtein = newIngredients.reduce(
			(sum, ing) => sum + ing.protein,
			0,
		)
		const newRecipeFat = newIngredients.reduce((sum, ing) => sum + ing.fat, 0)
		const newRecipeCarbs = newIngredients.reduce(
			(sum, ing) => sum + ing.carbohydrate,
			0,
		)

		const newRecipes = [...meal.recipes]
		newRecipes[recipeIndex] = {
			...recipe,
			ingredients: newIngredients,
			calories: newRecipeCalories,
			protein: newRecipeProtein,
			fat: newRecipeFat,
			carbohydrate: newRecipeCarbs,
		}

		const newMeals = [...formData.meals]
		newMeals[mealIndex] = { ...meal, recipes: newRecipes }

		setFormData((prev) => ({ ...prev, meals: newMeals }))
	}

	const adjustIngredientServeSize = (
		mealIndex: number,
		recipeIndex: number,
		ingredientIndex: number,
		delta: number,
	) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		const recipe = meal.recipes[recipeIndex]
		if (!recipe) return

		const ingredient = recipe.ingredients[ingredientIndex]
		if (!ingredient) return

		const newServeSize = Math.max(0, ingredient.serveSize + delta)
		updateIngredientServeSize(
			mealIndex,
			recipeIndex,
			ingredientIndex,
			newServeSize,
		)
	}

	const addIngredientToRecipe = (
		mealIndex: number,
		recipeIndex: number,
		ingredientId: string,
	) => {
		const ingredient = ingredients?.find((i) => i.id === ingredientId)
		if (!ingredient) return

		const meal = formData.meals[mealIndex]
		if (!meal) return

		const recipe = meal.recipes[recipeIndex]
		if (!recipe) return

		const newIngredient: MealIngredient = {
			id: crypto.randomUUID(),
			recipeToIngredientId: '',
			ingredientId: ingredient.id,
			ingredientName: ingredient.name,
			serveSize: roundToIngredientPrecision(
				ingredient.serveSize || 100,
				ingredient.precision,
			),
			serveUnit: ingredient.serveUnit || 'g',
			precision: normalizeIngredientPrecision(ingredient.precision),
			calories: ingredient.calories || 0,
			protein: ingredient.protein || 0,
			fat: ingredient.fat || 0,
			carbohydrate: ingredient.carbohydrate || 0,
		}

		const newRecipes = [...meal.recipes]
		newRecipes[recipeIndex] = {
			...recipe,
			ingredients: [...recipe.ingredients, newIngredient],
		}

		const newMeals = [...formData.meals]
		newMeals[mealIndex] = { ...meal, recipes: newRecipes }

		setFormData((prev) => ({ ...prev, meals: newMeals }))
	}

	const removeIngredientFromRecipe = (
		mealIndex: number,
		recipeIndex: number,
		ingredientIndex: number,
	) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		const recipe = meal.recipes[recipeIndex]
		if (!recipe) return

		const newIngredients = recipe.ingredients.filter(
			(_, i) => i !== ingredientIndex,
		)

		const newRecipes = [...meal.recipes]
		newRecipes[recipeIndex] = { ...recipe, ingredients: newIngredients }

		const newMeals = [...formData.meals]
		newMeals[mealIndex] = { ...meal, recipes: newRecipes }

		setFormData((prev) => ({ ...prev, meals: newMeals }))
	}

	const balanceCalories = (mealIndex: number) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		if (!meal.targetCalories || meal.targetCalories <= 0) {
			toast.error('Please set a target calorie value first')
			return
		}

		if (meal.recipes.length === 0) {
			toast.error('No recipes in this meal to balance')
			return
		}

		// Scale each recipe individually to meet the target calories
		// Each recipe is a choice, so each one should provide the full target calories
		const newMeals = [...formData.meals]
		const updatedRecipes = meal.recipes.map((recipe) => {
			if (recipe.calories === 0) {
				// Skip recipes with no calories - can't scale them
				return recipe
			}

			const scaleFactor = meal.targetCalories! / recipe.calories

			const updatedIngredients = recipe.ingredients.map((ing) =>
				recalculateMealIngredient(ing, ing.serveSize * scaleFactor),
			)
			const totalCalories = updatedIngredients.reduce(
				(sum, ing) => sum + ing.calories,
				0,
			)
			const totalProtein = updatedIngredients.reduce(
				(sum, ing) => sum + ing.protein,
				0,
			)
			const totalFat = updatedIngredients.reduce((sum, ing) => sum + ing.fat, 0)
			const totalCarbohydrate = updatedIngredients.reduce(
				(sum, ing) => sum + ing.carbohydrate,
				0,
			)

			return {
				...recipe,
				ingredients: updatedIngredients,
				calories: totalCalories,
				protein: totalProtein,
				fat: totalFat,
				carbohydrate: totalCarbohydrate,
			}
		})

		newMeals[mealIndex] = { ...meal, recipes: updatedRecipes }
		setFormData((prev) => ({ ...prev, meals: newMeals }))

		toast.success(
			`Each recipe scaled to ${Math.round(meal.targetCalories)} calories`,
		)
	}

	const balanceRecipeNutrition = (mealIndex: number) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		if (
			!meal.targetCalories ||
			meal.targetCalories <= 0 ||
			!meal.targetProtein ||
			meal.targetProtein <= 0
		) {
			toast.error(
				'Please set both target calories and target protein for this meal',
			)
			return
		}

		if (meal.recipes.length === 0) {
			toast.error('No recipes to balance in this meal')
			return
		}

		const newMeals = [...formData.meals]
		const newRecipes = [...meal.recipes]
		let balancedCount = 0
		let failedCount = 0

		// Balance each recipe in the meal
		meal.recipes.forEach((recipe, recipeIndex) => {
			if (recipe.ingredients.length < 2) {
				failedCount++
				return
			}

			try {
				// Select the best 2 ingredients for balancing
				const [proteinIndex, calorieIndex] = selectIngredientsForBalancing(
					recipe.ingredients,
				)

				// Get the selected ingredients
				const proteinIngredient = recipe.ingredients[proteinIndex]
				const calorieIngredient = recipe.ingredients[calorieIndex]

				// Calculate protein and calories per gram for these ingredients
				const proteinPerGram = [
					proteinIngredient.serveSize > 0
						? proteinIngredient.protein / proteinIngredient.serveSize
						: 0,
					calorieIngredient.serveSize > 0
						? calorieIngredient.protein / calorieIngredient.serveSize
						: 0,
				]

				const caloriesPerGram = [
					proteinIngredient.serveSize > 0
						? proteinIngredient.calories / proteinIngredient.serveSize
						: 0,
					calorieIngredient.serveSize > 0
						? calorieIngredient.calories / calorieIngredient.serveSize
						: 0,
				]

				// Calculate what the OTHER ingredients (not being adjusted) already contribute
				let otherProtein = 0
				let otherCalories = 0

				recipe.ingredients.forEach((ing, idx) => {
					if (idx !== proteinIndex && idx !== calorieIndex) {
						otherProtein += ing.protein
						otherCalories += ing.calories
					}
				})

				// The 2 adjustable ingredients need to make up the difference
				const remainingProtein = Math.max(0, meal.targetProtein! - otherProtein)
				const remainingCalories = Math.max(
					0,
					meal.targetCalories! - otherCalories,
				)

				// Solve for the required amounts for the 2 adjustable ingredients
				const solution = balanceRecipe(
					proteinPerGram,
					caloriesPerGram,
					remainingProtein,
					remainingCalories,
					[
						getMealIngredientPrecision(proteinIngredient),
						getMealIngredientPrecision(calorieIngredient),
					],
				)

				// Check if solution is valid
				if (!isValidSolution(solution)) {
					failedCount++
					return
				}

				// Update the selected ingredients with the calculated serve sizes
				const newIngredients = [...recipe.ingredients]

				// Update protein-focused ingredient
				const updatedProteinIng = recalculateMealIngredient(
					proteinIngredient,
					solution[0],
				)
				newIngredients[proteinIndex] = updatedProteinIng

				// Update calorie-focused ingredient
				const updatedCalorieIng = recalculateMealIngredient(
					calorieIngredient,
					solution[1],
				)
				newIngredients[calorieIndex] = updatedCalorieIng

				// Recalculate total recipe nutrition
				const totalCalories = newIngredients.reduce(
					(sum, ing) => sum + ing.calories,
					0,
				)
				const totalProtein = newIngredients.reduce(
					(sum, ing) => sum + ing.protein,
					0,
				)
				const totalFat = newIngredients.reduce((sum, ing) => sum + ing.fat, 0)
				const totalCarbs = newIngredients.reduce(
					(sum, ing) => sum + ing.carbohydrate,
					0,
				)

				newRecipes[recipeIndex] = {
					...recipe,
					ingredients: newIngredients,
					calories: totalCalories,
					protein: totalProtein,
					fat: totalFat,
					carbohydrate: totalCarbs,
				}

				balancedCount++
			} catch (_error) {
				failedCount++
			}
		})

		newMeals[mealIndex] = { ...meal, recipes: newRecipes }
		setFormData((prev) => ({ ...prev, meals: newMeals }))

		if (balancedCount > 0) {
			toast.success(
				`Balanced ${balancedCount} recipe(s) to ${Math.round(meal.targetCalories)} cal, ${Math.round(meal.targetProtein)}g protein`,
			)
		}

		if (failedCount > 0) {
			toast.error(`${failedCount} recipe(s) couldn't be balanced`)
		}
	}

	const formHeading = isEditMode
		? isTemplateMode
			? 'Edit Menu Template'
			: 'Edit User Menu'
		: isTemplateMode
			? 'Create Menu Template'
			: 'Create User Menu'
	const docsLinkTarget = isTemplateMode
		? 'createMenuTemplates'
		: 'assignMenuTemplateToUser'
	const docsLinkLabel = isTemplateMode ? 'Template Docs' : 'User Menu Docs'

	const isNameEdited =
		shouldHighlightEdits &&
		!!initialFormSnapshot &&
		normalizeText(formData.name) !== normalizeText(initialFormSnapshot.name)
	const isDescriptionEdited =
		shouldHighlightEdits &&
		!!initialFormSnapshot &&
		normalizeText(formData.description) !==
			normalizeText(initialFormSnapshot.description)
	const isStartDateEdited =
		shouldHighlightEdits &&
		!!initialFormSnapshot &&
		normalizeText(formData.startDate) !==
			normalizeText(initialFormSnapshot.startDate)
	const isEndDateEdited =
		shouldHighlightEdits &&
		!!initialFormSnapshot &&
		normalizeText(formData.endDate) !==
			normalizeText(initialFormSnapshot.endDate)

	const initialMealsById = React.useMemo(() => {
		return new Map(
			(initialFormSnapshot?.meals ?? []).map((meal) => [meal.id, meal]),
		)
	}, [initialFormSnapshot?.meals])

	const getEditedRecipeIds = React.useCallback(
		(meal: Meal) => {
			const editedRecipeIds = new Set<string>()
			if (!shouldHighlightEdits) return editedRecipeIds

			const baselineMeal = initialMealsById.get(meal.id)
			const baselineRecipesById = new Map(
				(baselineMeal?.recipes ?? []).map((recipe) => [recipe.id, recipe]),
			)

			for (const recipe of meal.recipes) {
				const baselineRecipe = baselineRecipesById.get(recipe.id)
				if (!baselineRecipe || !areRecipesEqual(recipe, baselineRecipe)) {
					editedRecipeIds.add(recipe.id)
				}
			}

			return editedRecipeIds
		},
		[initialMealsById, shouldHighlightEdits],
	)

	// Show user selector only in create mode when no user selected
	if (!isEditMode && !isTemplateMode && !user) {
		return (
			<div className='flex flex-col gap-4 p-8'>
				<div className='flex justify-end'>
					<DocsLink doc={docsLinkTarget} label={docsLinkLabel} />
				</div>
				<Card>
					<CardHeader>
						<CardTitle>No User Selected</CardTitle>
						<CardDescription>
							Please select a user from the sidebar before creating a menu.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	return (
		<SidebarProvider defaultOpen={false}>
			<div className='w-full min-h-svh'>
				<div className='flex flex-col gap-6 justify-center w-full'>
					{!isEditMode && !selectedTemplate ? (
						<div className='flex flex-col gap-6 justify-center p-8 w-full'>
							<div className='flex justify-between items-center'>
								<h1 className='text-2xl font-bold'>
									{isTemplateMode ? 'Create Menu Template' : 'Create User Menu'}
								</h1>
								<DocsLink doc={docsLinkTarget} label={docsLinkLabel} />
							</div>
							<Card>
								<CardHeader>
									<CardTitle>Select Menu Template</CardTitle>
									<CardDescription>
										Choose a menu template to use as the base for this
										user&apos;s menu.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
										<Card
											className='border-2 border-dashed transition-colors cursor-pointer hover:bg-muted'
											onClick={() => {
												setSelectedTemplate({ id: null, isBlank: true })
												setExpandedMeals(new Set())
												setExpandedRecipes(new Set())
												resetToEmptyForm()
											}}
										>
											<CardHeader>
												<CardTitle className='text-lg'>Blank Menu</CardTitle>
												<CardDescription>Start from scratch</CardDescription>
											</CardHeader>
											<CardContent>
												<p className='text-sm text-muted-foreground line-clamp-2'>
													Create a custom menu with no pre-defined structure.
												</p>
											</CardContent>
										</Card>

										{menuTemplates?.map((template) => (
											<Card
												key={template.id}
												className='transition-colors cursor-pointer hover:bg-muted'
												onClick={() => handleTemplateSelect(template)}
											>
												<CardHeader>
													<CardTitle className='text-lg'>
														{template.name}
													</CardTitle>
													<CardDescription>
														{template.meals?.length || 0} meals,{' '}
														{template.recipes?.length || 0} recipes
													</CardDescription>
												</CardHeader>
												<CardContent>
													<p className='text-sm text-muted-foreground line-clamp-2'>
														{template.description || 'No description'}
													</p>
												</CardContent>
											</Card>
										))}
										{!menuTemplates?.length && (
											<p className='col-span-full text-muted-foreground'>
												No menu templates available. Create one first.
											</p>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCorners}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							onDragOver={handleDragOver}
						>
							<div className='flex gap-0 items-start w-full'>
								<div className='relative flex flex-col flex-1 min-w-0'>
									<form
										onSubmit={(event) => {
											event.preventDefault()
											event.stopPropagation()
											form.handleSubmit()
										}}
										className='flex flex-col gap-6 p-8 min-w-0'
									>
										<div className='flex justify-between items-center'>
											<h1 className='text-2xl font-bold'>{formHeading}</h1>
											<div className='flex gap-2 items-center'>
												<DocsLink doc={docsLinkTarget} label={docsLinkLabel} />
												<SidebarTrigger size='default'>
													<Button render={<div />} className='cursor-pointer'>
														Recipes
														<SidebarIcon />
													</Button>
												</SidebarTrigger>
											</div>
										</div>
										{!isEditMode && !isTemplateMode && (
											<Button
												type='button'
												variant='ghost'
												onClick={() => {
													setSelectedTemplate(null)
													resetToEmptyForm()
												}}
												className='w-fit'
											>
												← Back to templates
											</Button>
										)}

										{isAiEnabled && (
											<Card>
												<CardHeader>
													<CardTitle>Ask AI</CardTitle>
													<CardDescription>
														Send a request and AI will update this menu form.
													</CardDescription>
												</CardHeader>
												<CardContent className='space-y-3'>
													<AiMenuRequestInput
														isPending={updateUserMenuWithAi.isPending}
														mode={aiMode}
														onModeChange={setAiMode}
														onSend={handleAiRequest}
													/>
												</CardContent>
											</Card>
										)}

										<Card>
											<CardHeader>
												<CardTitle>Menu Details</CardTitle>
												<CardDescription>
													{isTemplateMode
														? 'Configure the reusable menu template'
														: 'Configure the menu for the selected user'}
												</CardDescription>
											</CardHeader>
											<CardContent className='space-y-6'>
												<div className='space-y-4'>
													<form.Field name='name'>
														{(field) => (
															<div className='space-y-2'>
																<Label htmlFor={field.name}>Menu Name *</Label>
																<Input
																	id={field.name}
																	name={field.name}
																	value={field.state.value}
																	onBlur={field.handleBlur}
																	onChange={(event) =>
																		field.handleChange(event.target.value)
																	}
																	placeholder='e.g., Weight Loss Week 1'
																	className={
																		isNameEdited ? EDITED_FIELD_CLASS : ''
																	}
																	required
																/>
															</div>
														)}
													</form.Field>

													<form.Field name='description'>
														{(field) => (
															<div className='space-y-2'>
																<Label htmlFor={field.name}>Description</Label>
																<Textarea
																	id={field.name}
																	name={field.name}
																	value={field.state.value ?? ''}
																	onBlur={field.handleBlur}
																	onChange={(event) =>
																		field.handleChange(
																			event.target.value || null,
																		)
																	}
																	placeholder='Optional description for this menu...'
																	className={`min-h-20 ${
																		isDescriptionEdited
																			? EDITED_FIELD_CLASS
																			: ''
																	}`}
																/>
															</div>
														)}
													</form.Field>

													{!isTemplateMode && (
														<div className='grid grid-cols-2 gap-4'>
															<form.Field name='startDate'>
																{(field) => (
																	<div className='space-y-2'>
																		<Label htmlFor={field.name}>
																			Start Date
																		</Label>
																		<Input
																			id={field.name}
																			name={field.name}
																			type='date'
																			value={field.state.value ?? ''}
																			onBlur={field.handleBlur}
																			onChange={(event) =>
																				field.handleChange(
																					event.target.value ||
																						getTodayDateString(),
																				)
																			}
																			className={
																				isStartDateEdited
																					? EDITED_FIELD_CLASS
																					: ''
																			}
																		/>
																	</div>
																)}
															</form.Field>

															<form.Field name='endDate'>
																{(field) => (
																	<div className='space-y-2'>
																		<Label htmlFor={field.name}>End Date</Label>
																		<Input
																			id={field.name}
																			name={field.name}
																			type='date'
																			value={field.state.value ?? ''}
																			onBlur={field.handleBlur}
																			onChange={(event) =>
																				field.handleChange(
																					event.target.value || null,
																				)
																			}
																			className={
																				isEndDateEdited
																					? EDITED_FIELD_CLASS
																					: ''
																			}
																		/>
																	</div>
																)}
															</form.Field>
														</div>
													)}
												</div>

												<div className='pt-4 space-y-4 border-t'>
													<div className='flex justify-between items-center'>
														<div>
															<h2 className='text-lg font-semibold'>Meals</h2>
															<p className='text-sm text-muted-foreground'>
																Add, remove, or customize meals and their
																contents
															</p>
														</div>
														<Button
															type='button'
															variant='outline'
															onClick={addMeal}
														>
															<PlusIcon className='mr-2 size-4' />
															Add Meal
														</Button>
													</div>

													<div className='space-y-4'>
														{formData.meals.length === 0 ? (
															<div className='p-4 text-sm text-center rounded-md border text-muted-foreground'>
																No meals added yet. Click &quot;Add Meal&quot;
																to create your first meal.
															</div>
														) : (
															formData.meals.map((meal, mealIdx) => {
																const totals = calculateMealTotals(meal)
																const isExpanded = expandedMeals.has(mealIdx)
																const baselineMeal = initialMealsById.get(
																	meal.id,
																)
																const isMealEdited =
																	shouldHighlightEdits &&
																	(!baselineMeal ||
																		!areMealsEqual(meal, baselineMeal))
																const editedRecipeIds = getEditedRecipeIds(meal)
																return (
																	<div
																		key={meal.id}
																		className={`rounded-lg border ${
																			isMealEdited ? EDITED_FIELD_CLASS : ''
																		}`}
																	>
																		<MealHeader
																			meal={meal}
																			mealIdx={mealIdx}
																			totals={totals}
																			isExpanded={isExpanded}
																			isFirst={mealIdx === 0}
																			isLast={
																				mealIdx === formData.meals.length - 1
																			}
																			onToggle={() =>
																				toggleMealExpanded(mealIdx)
																			}
																			onRemove={() => removeMeal(mealIdx)}
																			onDuplicate={() => duplicateMeal(mealIdx)}
																			onMoveUp={() =>
																				moveMeal(mealIdx, mealIdx - 1)
																			}
																			onMoveDown={() =>
																				moveMeal(mealIdx, mealIdx + 1)
																			}
																		/>

																		{isExpanded && (
																			<MealContent
																				meal={meal}
																				mealIdx={mealIdx}
																				baselineMeal={baselineMeal}
																				highlightEdits={shouldHighlightEdits}
																				editedRecipeIds={editedRecipeIds}
																				recipeOptions={recipeOptions}
																				ingredientOptions={ingredientOptions}
																				expandedRecipes={expandedRecipes}
																				onUpdateName={updateMealName}
																				onUpdateTargets={updateMealTargets}
																				onAddRecipe={addRecipeToMeal}
																				onRemoveRecipe={removeRecipeFromMeal}
																				onToggleRecipe={toggleRecipeExpanded}
																				onUpdateIngredient={
																					updateIngredientServeSize
																				}
																				onAdjustIngredient={
																					adjustIngredientServeSize
																				}
																				onAddIngredient={addIngredientToRecipe}
																				onRemoveIngredient={
																					removeIngredientFromRecipe
																				}
																				onBalanceCalories={balanceCalories}
																				onBalanceRecipe={balanceRecipeNutrition}
																				onDuplicateRecipe={duplicateRecipe}
																			/>
																		)}
																	</div>
																)
															})
														)}
													</div>
												</div>
											</CardContent>
										</Card>

										<div className='flex gap-4 justify-end pt-4'>
											<Button
												type='button'
												variant='outline'
												onClick={() => {
													if (isEditMode) {
														if (isTemplateMode) {
															navigate({
																to: '/$orgSlug/menu-templates',
																params: { orgSlug },
															})
															return
														}

														navigate({
															to: '/$orgSlug/user-menus',
															params: { orgSlug },
															search: user ? { user } : {},
														})
													} else if (isTemplateMode) {
														navigate({
															to: '/$orgSlug/menu-templates',
															params: { orgSlug },
														})
													} else {
														setSelectedTemplate(null)
														resetToEmptyForm()
													}
												}}
											>
												Cancel
											</Button>
											<Button
												type='submit'
												disabled={
													updateUserMenuWithAi.isPending ||
													(isEditMode
														? batchUpdateMenuMutation.isPending
														: batchCreateMenuMutation.isPending)
												}
											>
												{isEditMode
													? batchUpdateMenuMutation.isPending
														? 'Saving...'
														: 'Save Changes'
													: batchCreateMenuMutation.isPending
														? isTemplateMode
															? 'Creating Template...'
															: 'Creating...'
														: isTemplateMode
															? 'Create Template'
															: 'Create Menu'}
											</Button>
										</div>
									</form>
									{updateUserMenuWithAi.isPending ? (
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

								<OrgRecipeSidebar
									recipes={filteredRecipes}
									searchValue={recipeSearch}
									totalRecipes={recipes?.length || 0}
									meals={formData.meals}
									onSearchChange={setRecipeSearch}
									onAddToMeal={(mealIndex, recipeId) => {
										addRecipeToMeal(mealIndex, recipeId)
									}}
								/>
							</div>

							<DragOverlay>
								{activeId ? (
									<RecipeCardOverlay
										recipe={formData.meals
											.flatMap((m) => m.recipes)
											.find((r) => r.id === activeId)}
										sourceRecipe={
											activeId.startsWith('library-recipe-')
												? recipes?.find(
														(recipe) =>
															recipe.id ===
															activeId.replace('library-recipe-', ''),
													)
												: undefined
										}
									/>
								) : null}
							</DragOverlay>
						</DndContext>
					)}
				</div>
			</div>
		</SidebarProvider>
	)
}
