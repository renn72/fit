import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'

import { DraggableRecipeCard, RecipeDropZone } from './recipe-cards'
import type { Meal } from './types'

import { ChefHatIcon } from '@phosphor-icons/react'

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
	onDuplicateRecipe: (mealIdx: number, recipeIdx: number) => void
}

export function MealContent({
	meal,
	mealIdx,
	recipeOptions,
	ingredientOptions,
	expandedRecipes,
	onUpdateName,
	onUpdateTargets,
	onAddRecipe,
	onRemoveRecipe,
	onToggleRecipe,
	onUpdateIngredient,
	onAdjustIngredient,
	onAddIngredient,
	onRemoveIngredient,
	onBalanceCalories,
	onBalanceRecipe,
	onDuplicateRecipe,
}: MealContentProps) {
	return (
		<div className='p-4 space-y-4 border-t'>
			<div className='grid grid-cols-7 gap-2 p-4 rounded-lg border bg-primary/3'>
				<div className='col-span-3'>
					<Label className='mb-2'>Meal Name</Label>
					<Input
						value={meal.name}
						onChange={(e) => onUpdateName(mealIdx, e.target.value)}
						placeholder={`Meal ${mealIdx + 1}`}
						className='h-9'
					/>
				</div>

				<div>
					<Label className='mb-2'>Target Calories</Label>
					<Input
						type='number'
						step='0.1'
						className='h-9'
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
					<Label className='mb-2'>Target Protein (g)</Label>
					<Input
						type='number'
						step='0.1'
						className='h-9'
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
						size='lg'
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
						size='lg'
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

			<div className='p-4 space-y-3 rounded-lg border-2 border-primary/30 bg-primary/3'>
				<div className='flex justify-between items-center pb-2 border-b border-primary/20'>
					<div className='flex gap-2 items-center'>
						<div className='p-1.5 rounded-md bg-primary/10'>
							<ChefHatIcon className='w-4 h-4 text-primary' />
						</div>
						<span className='text-sm font-semibold text-foreground'>
							Recipes
						</span>
						<span className='py-0.5 px-2 text-xs font-medium rounded-full bg-primary/10 text-primary'>
							{meal.recipes.length}
						</span>
					</div>
					<p className='text-xs text-muted-foreground'>
						Drag to reorder or move between meals
					</p>
				</div>
				<RecipeDropZone mealIdx={mealIdx} recipes={meal.recipes}>
					{meal.recipes?.map((recipe, recipeIdx) => (
						<DraggableRecipeCard
							key={recipe.id}
							recipe={recipe}
							recipeIdx={recipeIdx}
							mealIdx={mealIdx}
							ingredientOptions={ingredientOptions}
							isExpanded={expandedRecipes.has(recipe.id)}
							onToggle={() => onToggleRecipe(recipe.id)}
							onRemove={() => onRemoveRecipe(mealIdx, recipeIdx)}
							onDuplicate={() => onDuplicateRecipe(mealIdx, recipeIdx)}
							onUpdateIngredient={onUpdateIngredient}
							onAdjustIngredient={onAdjustIngredient}
							onAddIngredient={onAddIngredient}
							onRemoveIngredient={onRemoveIngredient}
						/>
					))}
				</RecipeDropZone>
			</div>
		</div>
	)
}
