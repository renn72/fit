import { Button } from '@fit/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@fit/components/ui/dropdown-menu'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarInput,
	SidebarRail,
} from '@fit/components/ui/sidebar'

import { getSourceRecipeTotals } from './nutrition-utils'
import type { Meal } from './types'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'

interface OrgRecipeSidebarProps {
	recipes: any[]
	searchValue: string
	totalRecipes: number
	meals: Meal[]
	onSearchChange: (value: string) => void
	onAddToMeal: (mealIndex: number, recipeId: string) => void
}

export function OrgRecipeSidebar({
	recipes,
	searchValue,
	totalRecipes,
	meals,
	onSearchChange,
	onAddToMeal,
}: OrgRecipeSidebarProps) {
	return (
		<Sidebar
			side='right'
			collapsible='offcanvas'
			variant='sidebar'
			className='inset-y-auto border-l h-svh'
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
								<DraggableOrgRecipeCard
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

function DraggableOrgRecipeCard({
	recipe,
	meals,
	onAddToMeal,
}: {
	recipe: any
	meals: Meal[]
	onAddToMeal: (mealIndex: number, recipeId: string) => void
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

	const totals = getSourceRecipeTotals(recipe)

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`rounded-md border bg-card p-2 space-y-2 transition-all ${
				isDragging ? 'opacity-0' : ''
			}`}
		>
			<div className='flex gap-2 items-start'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					className='p-0 mt-0.5 w-8 h-8 cursor-grab active:cursor-grabbing'
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
					<p className='text-xs text-muted-foreground'>
						{Math.round(totals.calories)} cal • {Math.round(totals.protein)}p
					</p>
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
								key={meal.id}
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
