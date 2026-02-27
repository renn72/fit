'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'

import {
	ArrowLeftIcon,
	CalendarIcon,
	ChefHatIcon,
	FireIcon,
	PencilIcon,
	PizzaIcon,
} from '@phosphor-icons/react'
import { format } from 'date-fns'

interface UserMenuWithFullDetails {
	id: string
	name: string
	description: string | null
	startDate: Date | null
	endDate: Date | null
	isActive: boolean
	createdAt: Date
	updatedAt: Date
	meals: Array<{
		id: string
		name: string | null
		mealIndex: number
		calories: number
		protein: number
		fat: number
		carbohydrate: number
		targetCalories: number | null
		targetProtein: number | null
	}>
	recipes: Array<{
		id: string
		name: string
		mealIndex: number
		recipeIndex: number
		description: string | null
		category: string | null
		prepTime: number | null
		cookTime: number | null
		servings: number | null
		instructions: string | null
		image: string | null
	}>
	ingredients: Array<{
		id: string
		mealIndex: number
		recipeIndex: number
		ingredientId: string
		serveSize: number
		serveUnit: string
		// Base ingredient data for calculation
		ingredient: {
			id: string
			name: string
			calories: number
			protein: number
			fat: number
			carbohydrate: number
			serveSize: number
			serveUnit: string
		} | null
		altIngredient: {
			id: string
			name: string
			calories: number
			protein: number
			fat: number
			carbohydrate: number
			serveSize: number
			serveUnit: string
		} | null
		altServeSize: number | null
		altServeUnit: string | null
	}>
}

// Calculate scaled nutrition for an ingredient
function calculateIngredientNutrition(
	ing: UserMenuWithFullDetails['ingredients'][0],
): {
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	name: string
} {
	const baseIng = ing.altIngredient ?? ing.ingredient
	if (!baseIng)
		return { calories: 0, protein: 0, fat: 0, carbohydrate: 0, name: 'Unknown' }

	const isAlt = !!ing.altIngredient
	const serveSize = isAlt ? (ing.altServeSize ?? ing.serveSize) : ing.serveSize
	const ratio = serveSize / baseIng.serveSize

	return {
		calories: baseIng.calories * ratio,
		protein: baseIng.protein * ratio,
		fat: baseIng.fat * ratio,
		carbohydrate: baseIng.carbohydrate * ratio,
		name: baseIng.name,
	}
}

// Calculate recipe nutrition from its ingredients
function calculateRecipeNutrition(
	recipe: UserMenuWithFullDetails['recipes'][0],
	allIngredients: UserMenuWithFullDetails['ingredients'],
): { calories: number; protein: number; fat: number; carbohydrate: number } {
	const recipeIngredients = allIngredients.filter(
		(i) =>
			i.mealIndex === recipe.mealIndex && i.recipeIndex === recipe.recipeIndex,
	)

	return recipeIngredients.reduce(
		(acc, ing) => {
			const nutrition = calculateIngredientNutrition(ing)
			return {
				calories: acc.calories + nutrition.calories,
				protein: acc.protein + nutrition.protein,
				fat: acc.fat + nutrition.fat,
				carbohydrate: acc.carbohydrate + nutrition.carbohydrate,
			}
		},
		{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
	)
}

// Calculate menu totals from meals
function calculateMenuTotals(meals: UserMenuWithFullDetails['meals']) {
	return meals.reduce(
		(acc, meal) => ({
			calories: acc.calories + (meal.calories || 0),
			protein: acc.protein + (meal.protein || 0),
			fat: acc.fat + (meal.fat || 0),
			carbohydrate: acc.carbohydrate + (meal.carbohydrate || 0),
		}),
		{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
	)
}

export function UserMenuDetailsPage() {
	const navigate = useNavigate()
	const { orgSlug, menuId } = useParams({
		from: '/$orgSlug/user-menu/$menuId',
	})
	const search = useSearch({ from: '/$orgSlug' })
	const userId = (search as { user?: string }).user

	const { data: menu } = useSuspenseQuery(
		orpc.userMenu.get.queryOptions({
			input: { id: menuId },
		}),
	)

	const typedMenu = menu as unknown as UserMenuWithFullDetails
	const menuTotals = calculateMenuTotals(typedMenu.meals || [])

	// Group recipes by meal with calculated nutrition
	const recipesByMeal = typedMenu.meals.map((meal) => {
		const mealRecipes = typedMenu.recipes
			.filter((r) => r.mealIndex === meal.mealIndex)
			.sort((a, b) => a.recipeIndex - b.recipeIndex)
			.map((recipe) => ({
				...recipe,
				...calculateRecipeNutrition(recipe, typedMenu.ingredients),
			}))

		return {
			...meal,
			recipes: mealRecipes,
		}
	})

	return (
		<div className='flex flex-col gap-6 p-8'>
			{/* Header */}
			<div className='flex justify-between items-start'>
				<div className='flex gap-4 items-center'>
					<Button
						variant='ghost'
						size='sm'
						onClick={() =>
							navigate({
								to: '/$orgSlug/user-menus',
								params: { orgSlug },
								search: userId ? { user: userId } : {},
							})
						}
					>
						<ArrowLeftIcon className='mr-2 size-4' />
						Back to Menus
					</Button>
				</div>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() =>
							navigate({
								to: '/$orgSlug/user-menu-edit/$menuId',
								params: { orgSlug, menuId },
							})
						}
					>
						<PencilIcon className='mr-2 size-4' />
						Edit
					</Button>
					{typedMenu.isActive ? (
						<Badge variant='default'>Active</Badge>
					) : (
						<Badge variant='secondary'>Inactive</Badge>
					)}
				</div>
			</div>

			{/* Menu Info */}
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold'>{typedMenu.name}</h1>
				{typedMenu.description && (
					<p className='text-lg text-muted-foreground'>
						{typedMenu.description}
					</p>
				)}
			</div>

			{/* Date Range */}
			{(typedMenu.startDate || typedMenu.endDate) && (
				<div className='flex gap-2 items-center text-sm text-muted-foreground'>
					<CalendarIcon className='size-4' />
					<span>
						{typedMenu.startDate &&
							format(new Date(typedMenu.startDate), 'MMM d, yyyy')}
						{typedMenu.startDate && typedMenu.endDate && ' - '}
						{typedMenu.endDate &&
							format(new Date(typedMenu.endDate), 'MMM d, yyyy')}
					</span>
				</div>
			)}

			{/* Daily Nutrition Summary */}
			<Card>
				<CardHeader>
					<CardTitle className='flex gap-2 items-center text-lg'>
						<FireIcon className='size-5' />
						Daily Nutrition Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
						<div className='space-y-1'>
							<div className='text-sm text-muted-foreground'>Calories</div>
							<div className='text-2xl font-bold'>
								{Math.round(menuTotals.calories)}
							</div>
						</div>
						<div className='space-y-1'>
							<div className='text-sm text-muted-foreground'>Protein</div>
							<div className='text-2xl font-bold text-blue-500'>
								{Math.round(menuTotals.protein)}g
							</div>
						</div>
						<div className='space-y-1'>
							<div className='text-sm text-muted-foreground'>Fat</div>
							<div className='text-2xl font-bold text-yellow-500'>
								{Math.round(menuTotals.fat)}g
							</div>
						</div>
						<div className='space-y-1'>
							<div className='text-sm text-muted-foreground'>Carbs</div>
							<div className='text-2xl font-bold text-green-500'>
								{Math.round(menuTotals.carbohydrate)}g
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Separator />

			{/* Meals */}
			<div className='space-y-6'>
				<h2 className='flex gap-2 items-center text-2xl font-semibold'>
					<PizzaIcon className='size-6' />
					Meals ({typedMenu.meals.length})
				</h2>

				{recipesByMeal.map((meal) => (
					<Card key={meal.id}>
						<CardHeader>
							<div className='flex justify-between items-start'>
								<div>
									<CardTitle className='text-xl'>
										{meal.name || `Meal ${meal.mealIndex + 1}`}
									</CardTitle>
									<CardDescription>
										{meal.recipes.length} recipe
										{meal.recipes.length !== 1 ? 's' : ''}
									</CardDescription>
								</div>
								<div className='text-sm text-right'>
									<div className='text-muted-foreground'>Targets</div>
									<div>
										{meal.targetCalories && `${meal.targetCalories} cal`}
										{meal.targetCalories && meal.targetProtein && ' | '}
										{meal.targetProtein && `${meal.targetProtein}g protein`}
									</div>
								</div>
							</div>
						</CardHeader>

						<CardContent className='space-y-4'>
							{/* Meal Nutrition */}
							<div className='grid grid-cols-4 gap-4 p-3 text-sm rounded-lg bg-muted/50'>
								<div className='text-center'>
									<div className='text-muted-foreground'>Calories</div>
									<div className='font-semibold'>
										{Math.round(meal.calories)}
									</div>
								</div>
								<div className='text-center'>
									<div className='text-muted-foreground'>Protein</div>
									<div className='font-semibold'>
										{Math.round(meal.protein)}g
									</div>
								</div>
								<div className='text-center'>
									<div className='text-muted-foreground'>Fat</div>
									<div className='font-semibold'>{Math.round(meal.fat)}g</div>
								</div>
								<div className='text-center'>
									<div className='text-muted-foreground'>Carbs</div>
									<div className='font-semibold'>
										{Math.round(meal.carbohydrate)}g
									</div>
								</div>
							</div>

							{/* Recipes */}
							<div className='space-y-3'>
								<h4 className='text-sm font-medium text-muted-foreground'>
									Recipes
								</h4>
								{meal.recipes.map((recipe, idx) => {
									const recipeIngredients = typedMenu.ingredients.filter(
										(i) =>
											i.mealIndex === meal.mealIndex &&
											i.recipeIndex === recipe.recipeIndex,
									)

									return (
										<Card key={recipe.id} className='border-l-4'>
											<CardHeader className='py-3'>
												<div className='flex justify-between items-start'>
													<div>
														<CardTitle className='flex gap-2 items-center text-base'>
															<ChefHatIcon className='size-4' />
															{idx + 1}. {recipe.name}
														</CardTitle>
														{recipe.category && (
															<Badge variant='outline' className='mt-1'>
																{recipe.category}
															</Badge>
														)}
													</div>
													<div className='text-sm text-right'>
														<div className='text-muted-foreground'>
															{Math.round(recipe.calories)} cal
														</div>
														<div>
															P: {Math.round(recipe.protein)}g | F:{' '}
															{Math.round(recipe.fat)}g | C:{' '}
															{Math.round(recipe.carbohydrate)}g
														</div>
													</div>
												</div>
											</CardHeader>

											{recipeIngredients.length > 0 && (
												<CardContent className='pt-0 pb-3'>
													<div className='text-sm'>
														<div className='mb-2 text-xs font-medium text-muted-foreground'>
															Ingredients
														</div>
														<div className='space-y-2'>
															{recipeIngredients.map((ing) => {
																const nutrition =
																	calculateIngredientNutrition(ing)
																return (
																	<div
																		key={ing.id}
																		className='flex justify-between items-center py-1 border-b border-muted last:border-0'
																	>
																		<div className='flex-1'>
																			<div className='font-medium'>
																				{nutrition.name}
																			</div>
																			<div className='text-xs text-muted-foreground'>
																				{ing.serveSize} {ing.serveUnit}
																			</div>
																		</div>
																		<div className='flex gap-4 text-xs text-muted-foreground text-right'>
																			<div className='min-w-[50px]'>
																				<div className='font-medium text-foreground'>
																					{Math.round(nutrition.calories)}
																				</div>
																				<div className='text-[10px]'>cal</div>
																			</div>
																			<div className='min-w-[40px]'>
																				<div className='font-medium text-foreground'>
																					{Math.round(nutrition.protein)}g
																				</div>
																				<div className='text-[10px]'>pro</div>
																			</div>
																			<div className='min-w-[40px]'>
																				<div className='font-medium text-foreground'>
																					{Math.round(nutrition.carbohydrate)}g
																				</div>
																				<div className='text-[10px]'>carb</div>
																			</div>
																			<div className='min-w-[40px]'>
																				<div className='font-medium text-foreground'>
																					{Math.round(nutrition.fat)}g
																				</div>
																				<div className='text-[10px]'>fat</div>
																			</div>
																		</div>
																	</div>
																)
															})}
														</div>
													</div>
												</CardContent>
											)}
										</Card>
									)
								})}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Footer Info */}
			<div className='pt-8 text-xs text-center text-muted-foreground'>
				Created: {format(new Date(typedMenu.createdAt), 'MMM d, yyyy')} | Last
				Updated: {format(new Date(typedMenu.updatedAt), 'MMM d, yyyy')}
			</div>
		</div>
	)
}
