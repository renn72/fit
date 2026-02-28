import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'

import { getSourceRecipeTotals } from './nutrition-utils'
import type { MealRecipe } from './types'

import { useDroppable } from '@dnd-kit/core'
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	CaretDownIcon,
	CaretUpIcon,
	CopyIcon,
	DotsSixVerticalIcon,
	TrashIcon,
} from '@phosphor-icons/react'

interface RecipeCardProps {
	recipe: MealRecipe
	recipeIdx: number
	mealIdx: number
	ingredientOptions: Array<{ value: string; label: string }>
	isExpanded: boolean
	onToggle: () => void
	onRemove: () => void
	onDuplicate: () => void
	onMoveUp?: () => void
	onMoveDown?: () => void
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
	isFirst?: boolean
	isLast?: boolean
	isDragSource?: boolean
	attributes?: any
	listeners?: any
}

interface RecipeDropZoneProps {
	mealIdx: number
	recipes: MealRecipe[]
	children: React.ReactNode
}

export function RecipeDropZone({
	mealIdx,
	recipes,
	children,
}: RecipeDropZoneProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: `meal-drop-${mealIdx}`,
		data: {
			type: 'meal-drop',
			mealIdx,
		},
	})

	return (
		<SortableContext
			items={recipes.map((r) => r.id)}
			strategy={verticalListSortingStrategy}
			id={`meal-drop-${mealIdx}`}
		>
			<div
				ref={setNodeRef}
				className={`space-y-3 transition-all duration-200 rounded-lg p-3 min-h-[60px] ${
					isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/30'
				}`}
			>
				{children}
			</div>
		</SortableContext>
	)
}

interface DraggableRecipeCardProps
	extends Omit<
		RecipeCardProps,
		'onMoveUp' | 'onMoveDown' | 'isFirst' | 'isLast'
	> {}

export function DraggableRecipeCard({
	recipe,
	recipeIdx,
	mealIdx,
	ingredientOptions,
	isExpanded,
	onToggle,
	onRemove,
	onDuplicate,
	onUpdateIngredient,
	onAdjustIngredient,
	onAddIngredient,
	onRemoveIngredient,
}: DraggableRecipeCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: recipe.id,
		data: {
			recipeId: recipe.id,
			mealIdx,
			recipeIdx,
			type: 'meal-recipe',
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
			className={`
				relative rounded-md border shadow-sm transition-all duration-200 bg-card
				${isDragging ? 'opacity-50 ring-2 ring-primary ring-offset-2 scale-[1.02]' : ''}
			`}
		>
			<RecipeCard
				recipe={recipe}
				recipeIdx={recipeIdx}
				mealIdx={mealIdx}
				ingredientOptions={ingredientOptions}
				isExpanded={isExpanded}
				onToggle={onToggle}
				onRemove={onRemove}
				onDuplicate={onDuplicate}
				onUpdateIngredient={onUpdateIngredient}
				onAdjustIngredient={onAdjustIngredient}
				onAddIngredient={onAddIngredient}
				onRemoveIngredient={onRemoveIngredient}
				isDragSource={isDragging}
				attributes={attributes}
				listeners={listeners}
			/>
		</div>
	)
}

function RecipeCard({
	recipe,
	recipeIdx,
	mealIdx,
	ingredientOptions,
	isExpanded,
	onToggle,
	onRemove,
	onDuplicate,
	onUpdateIngredient,
	onAdjustIngredient,
	onAddIngredient,
	onRemoveIngredient,
	isDragSource,
	attributes,
	listeners,
}: RecipeCardProps & { isDragSource?: boolean }) {
	return (
		<div
			className={`rounded-md border ${isDragSource ? 'ring-2 ring-primary' : ''}`}
		>
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
				<div className='flex gap-1 items-center'>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='p-0 w-8 h-8 cursor-grab active:cursor-grabbing'
						title='Drag to reorder'
						{...attributes}
						{...listeners}
					>
						<DotsSixVerticalIcon className='size-5 text-muted-foreground' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='p-0 w-6 h-6'
						onClick={(e) => {
							e.stopPropagation()
							onDuplicate()
						}}
						title='Duplicate recipe'
					>
						<CopyIcon className='size-3' />
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

export function RecipeCardOverlay({
	recipe,
	sourceRecipe,
}: {
	recipe?: MealRecipe
	sourceRecipe?: any
}) {
	if (!recipe && !sourceRecipe) return null

	const label = recipe?.recipeName || sourceRecipe?.name || 'Recipe'
	const calories = recipe
		? recipe.calories
		: getSourceRecipeTotals(sourceRecipe).calories

	return (
		<div className='rounded-md border shadow-lg opacity-90 rotate-2 bg-card'>
			<div className='flex gap-2 items-center p-2 rounded-t-md bg-muted'>
				<CaretDownIcon className='size-4' />
				<span className='flex-1'>{label}</span>
				<span className='text-xs text-muted-foreground'>
					{Math.round(calories)} cal
				</span>
			</div>
		</div>
	)
}
