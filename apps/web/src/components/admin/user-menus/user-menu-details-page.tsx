'use client'

import { Badge } from '@fit/components/ui/badge'
import { Button } from '@fit/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'

import {
	ArrowLeftIcon,
	CalendarIcon,
	CookingPotIcon,
	ForkKnifeIcon,
	PencilIcon,
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
			<div className='flex flex-wrap gap-3 justify-between items-center'>
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
				<div className='flex gap-2 items-center'>
					{typedMenu.isActive ? (
						<Badge variant='default' className='h-6'>
							Active
						</Badge>
					) : (
						<Badge variant='secondary' className='h-6'>
							Inactive
						</Badge>
					)}
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
				</div>
			</div>

			<Card className='overflow-hidden border-border/70 shadow-sm'>
				<CardHeader className='space-y-3 border-b bg-gradient-to-r from-orange-50/70 to-emerald-50/70 dark:from-orange-950/20 dark:to-emerald-950/20'>
					<div className='flex flex-col gap-3 justify-between sm:flex-row sm:items-start'>
						<div className='min-w-0'>
							<CardTitle className='text-2xl leading-tight break-words'>
								{typedMenu.name}
							</CardTitle>
							<p className='text-xs text-muted-foreground'>
								Created {format(new Date(typedMenu.createdAt), 'MMM d, yyyy')} •
								Updated {format(new Date(typedMenu.updatedAt), 'MMM d, yyyy')}
							</p>
						</div>
						{(typedMenu.startDate || typedMenu.endDate) && (
							<div className='flex gap-1.5 items-center py-1 px-2 text-xs rounded-md border bg-background/80 text-muted-foreground'>
								<CalendarIcon className='size-3.5' />
								<span>
									{typedMenu.startDate &&
										format(new Date(typedMenu.startDate), 'MMM d, yyyy')}
									{typedMenu.startDate && typedMenu.endDate && ' - '}
									{typedMenu.endDate &&
										format(new Date(typedMenu.endDate), 'MMM d, yyyy')}
								</span>
							</div>
						)}
					</div>
					<CardDescription className='text-sm leading-relaxed text-muted-foreground line-clamp-3'>
						{typedMenu.description || 'No description'}
					</CardDescription>
				</CardHeader>
				<CardContent className='pt-4'>
					<div className='space-y-2'>
						<div className='text-sm font-medium'>Daily Nutrition Summary</div>
						<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
							<div className='p-2 rounded-lg border bg-orange-50/80 dark:bg-orange-950/20'>
								<div className='text-[11px] text-muted-foreground'>
									Calories
								</div>
								<div className='text-sm font-semibold text-orange-700 dark:text-orange-300'>
									{Math.round(menuTotals.calories)} kcal
								</div>
							</div>
							<div className='p-2 rounded-lg border bg-emerald-50/80 dark:bg-emerald-950/20'>
								<div className='text-[11px] text-muted-foreground'>Protein</div>
								<div className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
									{Math.round(menuTotals.protein)} g
								</div>
							</div>
							<div className='p-2 rounded-lg border bg-blue-50/80 dark:bg-blue-950/20'>
								<div className='text-[11px] text-muted-foreground'>Carbs</div>
								<div className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
									{Math.round(menuTotals.carbohydrate)} g
								</div>
							</div>
							<div className='p-2 rounded-lg border bg-pink-50/80 dark:bg-pink-950/20'>
								<div className='text-[11px] text-muted-foreground'>Fat</div>
								<div className='text-sm font-semibold text-pink-700 dark:text-pink-300'>
									{Math.round(menuTotals.fat)} g
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className='space-y-4'>
				<div className='flex flex-wrap gap-2 justify-between items-center'>
					<h2 className='text-lg font-semibold'>Meal Schedule</h2>
					<div className='py-1 px-2 text-xs font-medium rounded-md border bg-muted/30 text-muted-foreground'>
						{typedMenu.meals.length} meals • {typedMenu.recipes.length} recipes
					</div>
				</div>

				{recipesByMeal.map((meal) => (
					<Card
						key={meal.id}
						className='overflow-hidden border-border/70 shadow-sm'
					>
						<CardHeader className='space-y-3 border-b bg-gradient-to-r from-orange-50/60 to-emerald-50/60 dark:from-orange-950/20 dark:to-emerald-950/20'>
							<div className='flex gap-3 justify-between items-start'>
								<div className='flex gap-2 items-center min-w-0'>
									<div className='p-1.5 rounded-md bg-orange-100 dark:bg-orange-950/40'>
										<CookingPotIcon className='size-4 text-orange-600 dark:text-orange-300' />
									</div>
									<div className='min-w-0'>
										<CardTitle className='text-base leading-tight truncate'>
											{meal.name || `Meal ${meal.mealIndex + 1}`}
										</CardTitle>
										<CardDescription className='text-xs'>
											{meal.recipes.length} recipe
											{meal.recipes.length !== 1 ? 's' : ''}
										</CardDescription>
									</div>
								</div>
								<div className='py-1 px-2 text-xs rounded-md border bg-background/80 text-muted-foreground'>
									{meal.targetCalories
										? `${meal.targetCalories} cal`
										: 'No cal target'}
									{' • '}
									{meal.targetProtein
										? `${meal.targetProtein} g protein`
										: 'No protein target'}
								</div>
							</div>
						</CardHeader>

						<CardContent className='pt-4 space-y-3'>
							<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
								<div className='py-1 px-2 rounded-md border bg-orange-50/70 dark:bg-orange-950/20'>
									<div className='text-[10px] uppercase text-muted-foreground'>
										Cal
									</div>
									<div className='text-xs font-medium'>
										{Math.round(meal.calories)} kcal
									</div>
								</div>
								<div className='py-1 px-2 rounded-md border bg-emerald-50/70 dark:bg-emerald-950/20'>
									<div className='text-[10px] uppercase text-muted-foreground'>
										Protein
									</div>
									<div className='text-xs font-medium'>
										{Math.round(meal.protein)} g
									</div>
								</div>
								<div className='py-1 px-2 rounded-md border bg-blue-50/70 dark:bg-blue-950/20'>
									<div className='text-[10px] uppercase text-muted-foreground'>
										Carbs
									</div>
									<div className='text-xs font-medium'>
										{Math.round(meal.carbohydrate)} g
									</div>
								</div>
								<div className='py-1 px-2 rounded-md border bg-pink-50/70 dark:bg-pink-950/20'>
									<div className='text-[10px] uppercase text-muted-foreground'>
										Fat
									</div>
									<div className='text-xs font-medium'>
										{Math.round(meal.fat)} g
									</div>
								</div>
							</div>

							<div className='space-y-2'>
								{meal.recipes.length === 0 ? (
									<div className='p-3 text-xs rounded-md border bg-muted/20 text-muted-foreground'>
										No recipes assigned to this meal.
									</div>
								) : (
									meal.recipes.map((recipe, idx) => {
										const recipeIngredients = typedMenu.ingredients.filter(
											(i) =>
												i.mealIndex === meal.mealIndex &&
												i.recipeIndex === recipe.recipeIndex,
										)

										return (
											<div
												key={recipe.id}
												className='p-3 space-y-2 rounded-md border bg-muted/20'
											>
												<div className='flex gap-2 justify-between items-start'>
													<div className='flex gap-2 items-center min-w-0'>
														<ForkKnifeIcon className='mt-0.5 shrink-0 size-4 text-emerald-600 dark:text-emerald-300' />
														<div className='min-w-0'>
															<p className='text-sm font-medium truncate'>
																{idx + 1}. {recipe.name}
															</p>
															<div className='flex gap-2 items-center'>
																{recipe.category && (
																	<Badge
																		variant='outline'
																		className='h-5 text-[10px] px-1.5'
																	>
																		{recipe.category}
																	</Badge>
																)}
																<p className='text-[11px] text-muted-foreground'>
																	{Math.round(recipe.calories)} kcal •{' '}
																	{Math.round(recipe.protein)} g protein
																</p>
															</div>
														</div>
													</div>
													<p className='text-[11px] text-muted-foreground whitespace-nowrap'>
														F {Math.round(recipe.fat)} g • C{' '}
														{Math.round(recipe.carbohydrate)} g
													</p>
												</div>

												{recipeIngredients.length > 0 && (
													<div className='pt-2 space-y-1 border-t border-border/60'>
														<div className='text-[11px] font-medium text-muted-foreground'>
															Ingredients
														</div>
														{recipeIngredients.map((ing) => {
															const nutrition =
																calculateIngredientNutrition(ing)
															const serveSize = ing.altIngredient
																? (ing.altServeSize ?? ing.serveSize)
																: ing.serveSize
															const serveUnit = ing.altIngredient
																? (ing.altServeUnit ?? ing.serveUnit)
																: ing.serveUnit

															return (
																<div
																	key={ing.id}
																	className='flex flex-col gap-1 justify-between py-1.5 px-2 rounded-md border bg-background sm:flex-row sm:items-center'
																>
																	<div className='min-w-0'>
																		<div className='text-xs font-medium truncate'>
																			{nutrition.name}
																		</div>
																		<div className='text-[11px] text-muted-foreground'>
																			{serveSize} {serveUnit}
																		</div>
																	</div>
																	<div className='text-[11px] text-muted-foreground'>
																		{Math.round(nutrition.calories)} kcal • P{' '}
																		{Math.round(nutrition.protein)} g • C{' '}
																		{Math.round(nutrition.carbohydrate)} g • F{' '}
																		{Math.round(nutrition.fat)} g
																	</div>
																</div>
															)
														})}
													</div>
												)}
											</div>
										)
									})
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
