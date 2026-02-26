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
import { Textarea } from '@/components/ui/textarea'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { orpc } from '@/utils/orpc'
import {
	balanceRecipe,
	isValidSolution,
	selectIngredientsForBalancing,
} from '@/utils/recipe-balancer'

import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import {
	CaretDownIcon,
	CaretUpIcon,
	PlusIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { toast } from 'sonner'

interface MealIngredient {
	id: string
	recipeToIngredientId: string
	ingredientId: string
	ingredientName: string
	serveSize: number
	serveUnit: string
	calories: number
	protein: number
	fat: number
	carbohydrate: number
}

interface MealRecipe {
	id: string
	recipeId: string
	recipeName: string
	recipeIndex: number
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	ingredients: MealIngredient[]
}

interface Meal {
	id: string
	mealIndex: number
	name: string
	targetCalories: number | null
	targetProtein: number | null
	recipes: MealRecipe[]
}

interface MenuFormData {
	name: string
	description: string | null
	startDate: string | null
	endDate: string | null
	meals: Meal[]
}

const route = getRouteApi('/$orgSlug/user-menu-create')

export function UserMenuCreatePage() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <UserMenuCreateForm userOrgId={userOrgId} />
}

function UserMenuCreateForm({ userOrgId }: { userOrgId: string }) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { user } = route.useSearch()
	const { orgSlug } = route.useParams()

	const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null)
	const [expandedMeals, setExpandedMeals] = React.useState<Set<number>>(
		new Set(),
	)
	const [expandedRecipes, setExpandedRecipes] = React.useState<Set<string>>(
		new Set(),
	)

	const [formData, setFormData] = React.useState<MenuFormData>({
		name: '',
		description: null,
		startDate: null,
		endDate: null,
		meals: [],
	})

	const { data: menuTemplates } = useSuspenseQuery(
		orpc.menuTemplate.getAllOrg.queryOptions({
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

	const createMenuMutation = useMutation(
		orpc.userMenu.create.mutationOptions({
			onSuccess: (menuData) => {
				toast.success('Menu created successfully')
				createAllMenuItems(menuData.id)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create menu')
			},
		}),
	)

	const createMealMutation = useMutation(
		orpc.userMenu.createMeal.mutationOptions(),
	)
	const createRecipeMutation = useMutation(
		orpc.userMenu.createRecipe.mutationOptions(),
	)
	const createIngredientMutation = useMutation(
		orpc.userMenu.createIngredient.mutationOptions(),
	)

	const recipeOptions = React.useMemo(() => {
		if (!recipes) return []
		return recipes.map((recipe) => ({
			value: recipe.id,
			label: recipe.name,
		}))
	}, [recipes])

	const ingredientOptions = React.useMemo(() => {
		if (!ingredients) return []
		return ingredients.map((ing) => ({
			value: ing.id,
			label: ing.name,
		}))
	}, [ingredients])

	const createAllMenuItems = async (userMenuId: string) => {
		try {
			for (const meal of formData.meals) {
				// Calculate meal nutrition as average of recipes
				// Use targetCalories/targetProtein if set, otherwise calculate from recipes
				const recipeCount = meal.recipes.length
				const totalCalories = meal.recipes.reduce(
					(sum, r) => sum + r.calories,
					0,
				)
				const totalProtein = meal.recipes.reduce((sum, r) => sum + r.protein, 0)
				const totalFat = meal.recipes.reduce((sum, r) => sum + r.fat, 0)
				const totalCarbs = meal.recipes.reduce(
					(sum, r) => sum + r.carbohydrate,
					0,
				)

				const avgCalories = recipeCount > 0 ? totalCalories / recipeCount : 0
				const avgProtein = recipeCount > 0 ? totalProtein / recipeCount : 0
				const avgFat = recipeCount > 0 ? totalFat / recipeCount : 0
				const avgCarbs = recipeCount > 0 ? totalCarbs / recipeCount : 0

				// Use target values if set for calories/protein, otherwise use averages
				// Fat and carbs are always calculated from recipe averages
				const mealCalories = meal.targetCalories ?? avgCalories
				const mealProtein = meal.targetProtein ?? avgProtein
				const mealFat = avgFat
				const mealCarbs = avgCarbs

				await createMealMutation.mutateAsync({
					userMenuId,
					mealIndex: meal.mealIndex,
					name: meal.name,
					calories: mealCalories,
					protein: mealProtein,
					fat: mealFat,
					carbohydrate: mealCarbs,
				})

				for (const recipe of meal.recipes) {
					const recipeData = await createRecipeMutation.mutateAsync({
						userMenuId,
						mealIndex: meal.mealIndex,
						recipeIndex: recipe.recipeIndex,
						name: recipe.recipeName,
						description: null,
						category: null,
						image: null,
						instructions: null,
					})

					for (const ingredient of recipe.ingredients) {
						await createIngredientMutation.mutateAsync({
							userMenuId,
							userRecipeId: recipeData.id,
							ingredientId: ingredient.ingredientId,
							mealIndex: meal.mealIndex,
							recipeIndex: recipe.recipeIndex,
							serveSize: ingredient.serveSize,
							serveUnit: ingredient.serveUnit,
						})
					}
				}
			}

			queryClient.invalidateQueries({ queryKey: orpc.userMenu.getByUser.key() })
			navigate({
				to: '/$orgSlug/user-menu-create',
				params: { orgSlug: orgSlug },
				search: { user: undefined },
			})
			toast.success('Menu and all items created successfully')
		} catch (error) {
			toast.error('Failed to create menu items')
			console.error(error)
		}
	}

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

			const fullRecipe = recipes?.find((r) => r.id === templateRecipe.recipe.id)
			if (!fullRecipe) continue

			const recipeIngredients: MealIngredient[] = (
				fullRecipe.ingredients || []
			).map((ing: any) => {
				const ingredientData = ing.ingredient
				if (!ingredientData) {
					return {
						id: crypto.randomUUID(),
						recipeToIngredientId: ing.id,
						ingredientId: ing.ingredientId,
						ingredientName: 'Unknown',
						serveSize: Math.round(ing.amount * 10) / 10,
						serveUnit: ing.unit,
						calories: 0,
						protein: 0,
						fat: 0,
						carbohydrate: 0,
					}
				}

				const multiplier =
					ingredientData.serveSize > 0
						? ing.amount / ingredientData.serveSize
						: 1

				return {
					id: crypto.randomUUID(),
					recipeToIngredientId: ing.id,
					ingredientId: ing.ingredientId,
					ingredientName: ingredientData.name,
					serveSize: Math.round(ing.amount * 10) / 10,
					serveUnit: ing.unit,
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
				recipeId: templateRecipe.recipe.id,
				recipeName: templateRecipe.recipe.name,
				recipeIndex: templateRecipe.recipeIndex,
				calories: recipeCalories,
				protein: recipeProtein,
				fat: recipeFat,
				carbohydrate: recipeCarbs,
				ingredients: recipeIngredients,
			}

			meal.recipes.push(mealRecipe)
		}

		setFormData({
			name: template.name,
			description: template.description,
			startDate: null,
			endDate: null,
			meals: initialMeals,
		})
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
			newMeals[mealIndex] = { ...newMeals[mealIndex], [field]: value }
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

	const addRecipeToMeal = (mealIndex: number, recipeId: string) => {
		const recipe = recipes?.find((r) => r.id === recipeId)
		if (!recipe) return

		const meal = formData.meals[mealIndex]
		if (!meal) return

		const recipeIngredients: MealIngredient[] = (recipe.ingredients || []).map(
			(ing: any) => {
				const ingredientData = ing.ingredient
				if (!ingredientData) {
					return {
						id: crypto.randomUUID(),
						recipeToIngredientId: ing.id,
						ingredientId: ing.ingredientId,
						ingredientName: 'Unknown',
						serveSize: Math.round(ing.amount * 10) / 10,
						serveUnit: ing.unit,
						calories: 0,
						protein: 0,
						fat: 0,
						carbohydrate: 0,
					}
				}

				const multiplier =
					ingredientData.serveSize > 0
						? ing.amount / ingredientData.serveSize
						: 1

				return {
					id: crypto.randomUUID(),
					recipeToIngredientId: ing.id,
					ingredientId: ing.ingredientId,
					ingredientName: ingredientData.name,
					serveSize: Math.round(ing.amount * 10) / 10,
					serveUnit: ing.unit,
					calories: ingredientData.calories * multiplier,
					protein: ingredientData.protein * multiplier,
					fat: ingredientData.fat * multiplier,
					carbohydrate: ingredientData.carbohydrate * multiplier,
				}
			},
		)

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

		const newRecipe: MealRecipe = {
			id: crypto.randomUUID(),
			recipeId: recipe.id,
			recipeName: recipe.name,
			recipeIndex: meal.recipes.length,
			calories: recipeCalories,
			protein: recipeProtein,
			fat: recipeFat,
			carbohydrate: recipeCarbs,
			ingredients: recipeIngredients,
		}

		const newMeals = [...formData.meals]
		newMeals[mealIndex] = {
			...meal,
			recipes: [...meal.recipes, newRecipe],
		}

		setFormData((prev) => ({ ...prev, meals: newMeals }))
		setExpandedRecipes((prev) => new Set([...prev, newRecipe.id]))
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

	const moveRecipeInMeal = (
		mealIndex: number,
		fromIndex: number,
		toIndex: number,
	) => {
		const meal = formData.meals[mealIndex]
		if (!meal) return

		if (toIndex < 0 || toIndex >= meal.recipes.length) return

		const newRecipes = [...meal.recipes]
		const [movedRecipe] = newRecipes.splice(fromIndex, 1)
		newRecipes.splice(toIndex, 0, movedRecipe)

		const reindexedRecipes = newRecipes.map((r, i) => ({
			...r,
			recipeIndex: i,
		}))

		const newMeals = [...formData.meals]
		newMeals[mealIndex] = { ...meal, recipes: reindexedRecipes }

		setFormData((prev) => ({ ...prev, meals: newMeals }))
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

		// Round serveSize to 0.1 precision
		const roundedServeSize = Math.round(serveSize * 10) / 10

		// Calculate the ratio of new serveSize to old serveSize
		const ratio =
			ingredient.serveSize > 0 ? roundedServeSize / ingredient.serveSize : 1

		const newIngredients = [...recipe.ingredients]
		newIngredients[ingredientIndex] = {
			...ingredient,
			serveSize: roundedServeSize,
			calories: ingredient.calories * ratio,
			protein: ingredient.protein * ratio,
			fat: ingredient.fat * ratio,
			carbohydrate: ingredient.carbohydrate * ratio,
		}

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
			serveSize: Math.round((ingredient.serveSize || 100) * 10) / 10,
			serveUnit: ingredient.serveUnit || 'g',
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

	const calculateMealTotals = (meal: Meal) => {
		return meal.recipes.reduce(
			(totals, recipe) => ({
				calories: totals.calories + recipe.calories,
				protein: totals.protein + recipe.protein,
				fat: totals.fat + recipe.fat,
				carbohydrate: totals.carbohydrate + recipe.carbohydrate,
			}),
			{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
		)
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

			const updatedIngredients = recipe.ingredients.map((ing) => ({
				...ing,
				serveSize: Math.round(ing.serveSize * scaleFactor * 10) / 10,
				calories: ing.calories * scaleFactor,
				protein: ing.protein * scaleFactor,
				fat: ing.fat * scaleFactor,
				carbohydrate: ing.carbohydrate * scaleFactor,
			}))

			return {
				...recipe,
				ingredients: updatedIngredients,
				calories: recipe.calories * scaleFactor,
				protein: recipe.protein * scaleFactor,
				fat: recipe.fat * scaleFactor,
				carbohydrate: recipe.carbohydrate * scaleFactor,
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
				)

				// Check if solution is valid
				if (!isValidSolution(solution)) {
					failedCount++
					return
				}

				// Update the selected ingredients with the calculated serve sizes
				const newIngredients = [...recipe.ingredients]

				// Update protein-focused ingredient
				const updatedProteinIng = { ...proteinIngredient }
				updatedProteinIng.serveSize = Math.round(solution[0] * 10) / 10
				updatedProteinIng.calories =
					(proteinIngredient.calories / proteinIngredient.serveSize) *
					solution[0]
				updatedProteinIng.protein =
					(proteinIngredient.protein / proteinIngredient.serveSize) *
					solution[0]
				updatedProteinIng.fat =
					(proteinIngredient.fat / proteinIngredient.serveSize) * solution[0]
				updatedProteinIng.carbohydrate =
					(proteinIngredient.carbohydrate / proteinIngredient.serveSize) *
					solution[0]
				newIngredients[proteinIndex] = updatedProteinIng

				// Update calorie-focused ingredient
				const updatedCalorieIng = { ...calorieIngredient }
				updatedCalorieIng.serveSize = Math.round(solution[1] * 10) / 10
				updatedCalorieIng.calories =
					(calorieIngredient.calories / calorieIngredient.serveSize) *
					solution[1]
				updatedCalorieIng.protein =
					(calorieIngredient.protein / calorieIngredient.serveSize) *
					solution[1]
				updatedCalorieIng.fat =
					(calorieIngredient.fat / calorieIngredient.serveSize) * solution[1]
				updatedCalorieIng.carbohydrate =
					(calorieIngredient.carbohydrate / calorieIngredient.serveSize) *
					solution[1]
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
			} catch (error) {
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) {
			toast.error('No user selected')
			return
		}

		await createMenuMutation.mutateAsync({
			userId: user,
			menuTemplateId: selectedTemplate?.id || null,
			name: formData.name,
			description: formData.description,
			startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
			endDate: formData.endDate ? new Date(formData.endDate) : null,
		})
	}

	if (!user) {
		return (
			<div className='flex flex-col gap-4 p-8'>
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
		<div className='flex flex-col gap-6 p-8'>
			<h1 className='text-2xl font-bold'>Create User Menu</h1>

			{!selectedTemplate ? (
				<Card>
					<CardHeader>
						<CardTitle>Select Menu Template</CardTitle>
						<CardDescription>
							Choose a menu template to use as the base for this user&apos;s
							menu.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{menuTemplates?.map((template) => (
								<Card
									key={template.id}
									className='transition-colors cursor-pointer hover:bg-muted'
									onClick={() => handleTemplateSelect(template)}
								>
									<CardHeader>
										<CardTitle className='text-lg'>{template.name}</CardTitle>
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
			) : (
				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<Button
						type='button'
						variant='ghost'
						onClick={() => {
							setSelectedTemplate(null)
							setFormData({
								name: '',
								description: null,
								startDate: null,
								endDate: null,
								meals: [],
							})
						}}
						className='w-fit'
					>
						← Back to templates
					</Button>

					<Card>
						<CardHeader>
							<CardTitle>Menu Details</CardTitle>
							<CardDescription>
								Configure the menu for the selected user
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='name'>Menu Name *</Label>
									<Input
										id='name'
										value={formData.name}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, name: e.target.value }))
										}
										placeholder='e.g., Weight Loss Week 1'
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='description'>Description</Label>
									<Textarea
										id='description'
										value={formData.description ?? ''}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description: e.target.value || null,
											}))
										}
										placeholder='Optional description for this menu...'
										className='min-h-20'
									/>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='startDate'>Start Date</Label>
										<Input
											id='startDate'
											type='date'
											value={formData.startDate ?? ''}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													startDate: e.target.value || null,
												}))
											}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='endDate'>End Date</Label>
										<Input
											id='endDate'
											type='date'
											value={formData.endDate ?? ''}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													endDate: e.target.value || null,
												}))
											}
										/>
									</div>
								</div>
							</div>

							<div className='pt-4 space-y-4 border-t'>
								<div className='flex justify-between items-center'>
									<div>
										<h2 className='text-lg font-semibold'>Meals</h2>
										<p className='text-sm text-muted-foreground'>
											Add, remove, or customize meals and their contents
										</p>
									</div>
									<Button type='button' variant='outline' onClick={addMeal}>
										<PlusIcon className='mr-2 size-4' />
										Add Meal
									</Button>
								</div>

								<div className='space-y-4'>
									{formData.meals.length === 0 ? (
										<div className='p-4 text-sm text-center rounded-md border text-muted-foreground'>
											No meals added yet. Click &quot;Add Meal&quot; to create
											your first meal.
										</div>
									) : (
										formData.meals.map((meal, mealIdx) => {
											const totals = calculateMealTotals(meal)
											const isExpanded = expandedMeals.has(mealIdx)
											return (
												<div key={meal.id} className='rounded-lg border'>
													<MealHeader
														meal={meal}
														mealIdx={mealIdx}
														totals={totals}
														isExpanded={isExpanded}
														onToggle={() => toggleMealExpanded(mealIdx)}
														onRemove={() => removeMeal(mealIdx)}
													/>

													{isExpanded && (
														<MealContent
															meal={meal}
															mealIdx={mealIdx}
															recipeOptions={recipeOptions}
															ingredientOptions={ingredientOptions}
															expandedRecipes={expandedRecipes}
															onUpdateName={updateMealName}
															onUpdateTargets={updateMealTargets}
															onAddRecipe={addRecipeToMeal}
															onRemoveRecipe={removeRecipeFromMeal}
															onMoveRecipe={moveRecipeInMeal}
															onToggleRecipe={toggleRecipeExpanded}
															onUpdateIngredient={updateIngredientServeSize}
															onAdjustIngredient={adjustIngredientServeSize}
															onAddIngredient={addIngredientToRecipe}
															onRemoveIngredient={removeIngredientFromRecipe}
															onBalanceCalories={balanceCalories}
															onBalanceRecipe={balanceRecipeNutrition}
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
								setSelectedTemplate(null)
								setFormData({
									name: '',
									description: null,
									startDate: null,
									endDate: null,
									meals: [],
								})
							}}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={createMenuMutation.isPending}>
							{createMenuMutation.isPending ? 'Creating...' : 'Create Menu'}
						</Button>
					</div>
				</form>
			)}
		</div>
	)
}

interface MealHeaderProps {
	meal: Meal
	mealIdx: number
	totals: {
		calories: number
		protein: number
		fat: number
		carbohydrate: number
	}
	isExpanded: boolean
	onToggle: () => void
	onRemove: () => void
}

function MealHeader({
	meal,
	totals,
	isExpanded,
	onToggle,
	onRemove,
}: MealHeaderProps) {
	return (
		<div
			className='flex justify-between items-start p-4 cursor-pointer hover:bg-muted/50'
			onClick={onToggle}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					onToggle()
				}
			}}
			role='button'
			tabIndex={0}
		>
			<div className='flex-1'>
				<div className='flex gap-4 items-center'>
					<div className='flex gap-2 items-center'>
						{isExpanded ? (
							<CaretUpIcon className='size-4' />
						) : (
							<CaretDownIcon className='size-4' />
						)}
						<span className='font-semibold'>{meal.name}</span>
					</div>
					<div className='text-sm text-muted-foreground'>
						{meal.recipes.length} recipes •{' '}
						{meal.recipes.length > 0
							? Math.round(totals.calories / meal.recipes.length)
							: 0}{' '}
						cal
					</div>
				</div>
			</div>
			<Button
				type='button'
				variant='ghost'
				size='sm'
				onClick={(e) => {
					e.stopPropagation()
					onRemove()
				}}
				className='text-red-500'
			>
				<TrashIcon className='size-4' />
			</Button>
		</div>
	)
}

interface MealContentProps {
	meal: Meal
	mealIdx: number
	recipeOptions: Array<{ value: string; label: string }>
	ingredientOptions: Array<{ value: string; label: string }>
	expandedRecipes: Set<string>
	onUpdateName: (idx: number, name: string) => void
	onUpdateTargets: (
		idx: number,
		field: 'targetCalories' | 'targetProtein',
		val: number | null,
	) => void
	onAddRecipe: (mealIdx: number, recipeId: string) => void
	onRemoveRecipe: (mealIdx: number, recipeIdx: number) => void
	onMoveRecipe: (mealIdx: number, from: number, to: number) => void
	onToggleRecipe: (recipeId: string) => void
	onUpdateIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingIdx: number,
		serveSize: number,
	) => void
	onAdjustIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingIdx: number,
		delta: number,
	) => void
	onAddIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingredientId: string,
	) => void
	onRemoveIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingIdx: number,
	) => void
	onBalanceCalories: (mealIdx: number) => void
	onBalanceRecipe: (mealIdx: number) => void
}

function MealContent({
	meal,
	mealIdx,
	recipeOptions,
	ingredientOptions,
	expandedRecipes,
	onUpdateName,
	onUpdateTargets,
	onAddRecipe,
	onRemoveRecipe,
	onMoveRecipe,
	onToggleRecipe,
	onUpdateIngredient,
	onAdjustIngredient,
	onAddIngredient,
	onRemoveIngredient,
	onBalanceCalories,
	onBalanceRecipe,
}: MealContentProps) {
	return (
		<div className='p-4 space-y-4 border-t'>
			<div className='space-y-2'>
				<Label>Meal Name</Label>
				<Input
					value={meal.name}
					onChange={(e) => onUpdateName(mealIdx, e.target.value)}
					placeholder={`Meal ${mealIdx + 1}`}
				/>
			</div>

			<div className='grid grid-cols-4 gap-2'>
				<div>
					<Label className='text-xs'>Target Calories</Label>
					<Input
						type='number'
						value={meal.targetCalories ?? ''}
						onChange={(e) =>
							onUpdateTargets(
								mealIdx,
								'targetCalories',
								e.target.value ? Number.parseFloat(e.target.value) : null,
							)
						}
						placeholder='kcal'
					/>
				</div>
				<div>
					<Label className='text-xs'>Target Protein (g)</Label>
					<Input
						type='number'
						value={meal.targetProtein ?? ''}
						onChange={(e) =>
							onUpdateTargets(
								mealIdx,
								'targetProtein',
								e.target.value ? Number.parseFloat(e.target.value) : null,
							)
						}
						placeholder='g'
					/>
				</div>
				<div className='flex items-end'>
					<Button
						type='button'
						onClick={() => onBalanceCalories(mealIdx)}
						className='w-full'
					>
						Balance Calories
					</Button>
				</div>
				<div className='flex items-end'>
					<Button
						type='button'
						variant='secondary'
						onClick={() => onBalanceRecipe(mealIdx)}
						className='w-full'
						disabled={!meal.targetCalories || !meal.targetProtein}
						title={
							!meal.targetCalories || !meal.targetProtein
								? 'Set both target calories and protein first'
								: 'Balance all recipes to target protein and calories'
						}
					>
						Balance P&C
					</Button>
				</div>
			</div>

			<div className='pt-2 space-y-2'>
				<Label className='text-sm font-medium'>Add Recipe</Label>
				<VirtualizedCombobox
					options={recipeOptions}
					selectedOption=''
					onSelectOption={(val) => {
						if (val) onAddRecipe(mealIdx, val)
					}}
					searchPlaceholder='Search recipes...'
					width='100%'
					height='200px'
				/>
			</div>

			{meal.recipes.length > 0 && (
				<div className='pt-2 space-y-2'>
					<div className='text-sm font-medium'>
						Recipes ({meal.recipes.length})
					</div>
					<div className='space-y-2'>
						{meal.recipes.map((recipe, recipeIdx) => (
							<RecipeCard
								key={recipe.id}
								recipe={recipe}
								recipeIdx={recipeIdx}
								mealIdx={mealIdx}
								ingredientOptions={ingredientOptions}
								isExpanded={expandedRecipes.has(recipe.id)}
								onToggle={() => onToggleRecipe(recipe.id)}
								onRemove={() => onRemoveRecipe(mealIdx, recipeIdx)}
								onMoveUp={() => onMoveRecipe(mealIdx, recipeIdx, recipeIdx - 1)}
								onMoveDown={() =>
									onMoveRecipe(mealIdx, recipeIdx, recipeIdx + 1)
								}
								onUpdateIngredient={onUpdateIngredient}
								onAdjustIngredient={onAdjustIngredient}
								onAddIngredient={onAddIngredient}
								onRemoveIngredient={onRemoveIngredient}
								isFirst={recipeIdx === 0}
								isLast={recipeIdx === meal.recipes.length - 1}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

interface RecipeCardProps {
	recipe: MealRecipe
	recipeIdx: number
	mealIdx: number
	ingredientOptions: Array<{ value: string; label: string }>
	isExpanded: boolean
	onToggle: () => void
	onRemove: () => void
	onMoveUp: () => void
	onMoveDown: () => void
	onUpdateIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingIdx: number,
		serveSize: number,
	) => void
	onAdjustIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingIdx: number,
		delta: number,
	) => void
	onAddIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingredientId: string,
	) => void
	onRemoveIngredient: (
		mealIdx: number,
		recipeIdx: number,
		ingIdx: number,
	) => void
	isFirst: boolean
	isLast: boolean
}

function RecipeCard({
	recipe,
	recipeIdx,
	mealIdx,
	ingredientOptions,
	isExpanded,
	onToggle,
	onRemove,
	onMoveUp,
	onMoveDown,
	onUpdateIngredient,
	onAdjustIngredient,
	onAddIngredient,
	onRemoveIngredient,
	isFirst,
	isLast,
}: RecipeCardProps) {
	return (
		<div className='rounded-md border'>
			<div
				className='flex gap-2 items-center p-2 rounded-t-md cursor-pointer bg-muted'
				onClick={onToggle}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						onToggle()
					}
				}}
				role='button'
				tabIndex={0}
			>
				{isExpanded ? (
					<CaretUpIcon className='size-4' />
				) : (
					<CaretDownIcon className='size-4' />
				)}
				<span className='flex-1'>
					{recipeIdx + 1}. {recipe.recipeName}
				</span>
				<span className='text-xs text-muted-foreground'>
					{Math.round(recipe.calories)} cal
				</span>
				<div className='flex gap-1'>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='p-0 w-6 h-6'
						onClick={(e) => {
							e.stopPropagation()
							onMoveUp()
						}}
						disabled={isFirst}
					>
						<CaretUpIcon className='size-3' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='p-0 w-6 h-6'
						onClick={(e) => {
							e.stopPropagation()
							onMoveDown()
						}}
						disabled={isLast}
					>
						<CaretDownIcon className='size-3' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='p-0 w-6 h-6 text-red-500'
						onClick={(e) => {
							e.stopPropagation()
							onRemove()
						}}
					>
						<TrashIcon className='size-3' />
					</Button>
				</div>
			</div>

			{isExpanded && (
				<div className='p-3 space-y-3'>
					<div className='grid grid-cols-4 gap-2 p-1 text-sm font-medium rounded-lg border-2 bg-primary/5 border-primary/20'>
						<div className='text-center'>
							<div className='text-xs text-muted-foreground'>Calories</div>
							<div className='text-primary'>{Math.round(recipe.calories)}</div>
						</div>
						<div className='text-center'>
							<div className='text-xs text-muted-foreground'>Protein</div>
							<div className='text-primary'>{Math.round(recipe.protein)}g</div>
						</div>
						<div className='text-center'>
							<div className='text-xs text-muted-foreground'>Fat</div>
							<div className='text-primary'>{Math.round(recipe.fat)}g</div>
						</div>
						<div className='text-center'>
							<div className='text-xs text-muted-foreground'>Carbs</div>
							<div className='text-primary'>
								{Math.round(recipe.carbohydrate)}g
							</div>
						</div>
					</div>

					<div className='space-y-2'>
						<div className='flex justify-between items-center'>
							<Label className='text-sm'>Ingredients</Label>
							<VirtualizedCombobox
								options={ingredientOptions}
								selectedOption=''
								onSelectOption={(val) => {
									if (val) onAddIngredient(mealIdx, recipeIdx, val)
								}}
								searchPlaceholder='Add ingredient...'
								width='200px'
								height='150px'
							/>
						</div>

						{recipe.ingredients.length > 0 ? (
							<table className='w-full text-sm'>
								<thead>
									<tr className='text-xs border-b text-muted-foreground'>
										<th className='py-1 text-left'>Ingredient</th>
										<th className='py-1 text-right'>Amount</th>
										<th className='py-1 text-right'>Unit</th>
										<th className='py-1 text-right'>Cal</th>
										<th className='py-1 text-right'>P</th>
										<th className='py-1 text-right'>F</th>
										<th className='py-1 text-right'>C</th>
										<th className='w-8' />
									</tr>
								</thead>
								<tbody>
									{recipe.ingredients.map((ingredient, ingIdx) => (
										<tr key={ingredient.id} className='border-b last:border-0'>
											<td className='py-1'>{ingredient.ingredientName}</td>
											<td className='flex gap-1 justify-end items-center py-1'>
												<Button
													type='button'
													variant='ghost'
													size='sm'
													className='p-0 w-5 h-7'
													onClick={() =>
														onAdjustIngredient(mealIdx, recipeIdx, ingIdx, -5)
													}
												>
													-
												</Button>
												<Input
													type='number'
													value={ingredient.serveSize}
													onChange={(e) =>
														onUpdateIngredient(
															mealIdx,
															recipeIdx,
															ingIdx,
															Number.parseFloat(e.target.value) || 0,
														)
													}
													className='w-16 h-7 text-right'
												/>
												<Button
													type='button'
													variant='ghost'
													size='sm'
													className='p-0 w-5 h-7'
													onClick={() =>
														onAdjustIngredient(mealIdx, recipeIdx, ingIdx, 5)
													}
												>
													+
												</Button>
											</td>
											<td className='py-1 text-right'>
												{ingredient.serveUnit}
											</td>
											<td className='py-1 text-right text-muted-foreground'>
												{Math.round(ingredient.calories)}
											</td>
											<td className='py-1 text-right text-muted-foreground'>
												{Math.round(ingredient.protein)}g
											</td>
											<td className='py-1 text-right text-muted-foreground'>
												{Math.round(ingredient.fat)}g
											</td>
											<td className='py-1 text-right text-muted-foreground'>
												{Math.round(ingredient.carbohydrate)}g
											</td>
											<td className='py-1 text-right'>
												<Button
													type='button'
													variant='ghost'
													size='sm'
													className='p-0 w-6 h-6 text-red-500'
													onClick={() =>
														onRemoveIngredient(mealIdx, recipeIdx, ingIdx)
													}
												>
													<TrashIcon className='size-3' />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p className='text-sm italic text-muted-foreground'>
								No ingredients added
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
