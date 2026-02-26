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
	totalCalories: number | null
	totalProtein: number | null
	totalFat: number | null
	totalCarbohydrate: number | null
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
		calories: number
		protein: number
		fat: number
		carbohydrate: number
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
		ingredientName: string
		serveSize: number
		serveUnit: string
		calories: number
		protein: number
		fat: number
		carbohydrate: number
	}>
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

	// Group recipes by meal
	const recipesByMeal = typedMenu.meals.map((meal) => ({
		...meal,
		recipes: typedMenu.recipes
			.filter((r) => r.mealIndex === meal.mealIndex)
			.sort((a, b) => a.recipeIndex - b.recipeIndex),
	}))

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
								{Math.round(typedMenu.totalCalories || 0)}
							</div>
						</div>
						<div className='space-y-1'>
							<div className='text-sm text-muted-foreground'>Protein</div>
							<div className='text-2xl font-bold text-blue-500'>
								{Math.round(typedMenu.totalProtein || 0)}g
							</div>
						</div>
						<div className='space-y-1'>
							<div className='text-sm text-muted-foreground'>Fat</div>
							<div className='text-2xl font-bold text-yellow-500'>
								{Math.round(typedMenu.totalFat || 0)}g
							</div>
						</div>
						<div className='space-y-1'>
							<div className='text-sm text-muted-foreground'>Carbs</div>
							<div className='text-2xl font-bold text-green-500'>
								{Math.round(typedMenu.totalCarbohydrate || 0)}g
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
														<div className='space-y-1'>
															{recipeIngredients.map((ing) => (
																<div
																	key={ing.id}
																	className='flex justify-between text-sm'
																>
																	<span>{ing.ingredientName}</span>
																	<span className='text-muted-foreground'>
																		{ing.serveSize} {ing.serveUnit} |{' '}
																		{Math.round(ing.calories)} cal
																	</span>
																</div>
															))}
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
