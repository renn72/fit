import { Button } from '@/components/ui/button'

import type { MacroTotals, Meal } from './types'

import {
	CaretDownIcon,
	CaretUpIcon,
	CopyIcon,
	TrashIcon,
} from '@phosphor-icons/react'

interface MealHeaderProps {
	meal: Meal
	mealIdx: number
	totals: MacroTotals
	isExpanded: boolean
	isFirst: boolean
	isLast: boolean
	onToggle: () => void
	onRemove: () => void
	onDuplicate: () => void
	onMoveUp: () => void
	onMoveDown: () => void
}

export function MealHeader({
	meal,
	totals,
	isExpanded,
	isFirst,
	isLast,
	onToggle,
	onRemove,
	onDuplicate,
	onMoveUp,
	onMoveDown,
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
					className='p-0 w-6 h-6'
					onClick={(e) => {
						e.stopPropagation()
						onDuplicate()
					}}
					title='Duplicate meal'
				>
					<CopyIcon className='size-3' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={(e) => {
						e.stopPropagation()
						onRemove()
					}}
					className='p-0 w-6 h-6 text-red-500'
				>
					<TrashIcon className='size-3' />
				</Button>
			</div>
		</div>
	)
}
