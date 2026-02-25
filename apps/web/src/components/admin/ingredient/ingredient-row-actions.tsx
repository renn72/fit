'use client'

import { useState } from 'react'

import { IngredientEditForm } from '@/components/admin/ingredient/ingredient-edit-form'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { Row } from '@tanstack/react-table'

import { DotsThreeOutlineVerticalIcon } from '@phosphor-icons/react'

interface Ingredient {
	id: string
	name: string
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
	serveUnit: string
}

interface IngredientRowActionsProps<TData> {
	row: Row<TData>
}

export function IngredientRowActions<TData>({
	row,
}: IngredientRowActionsProps<TData>) {
	const [isEditOpen, setIsEditOpen] = useState(false)
	const ingredient = row.original as Ingredient

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							size='icon'
							variant='ghost'
							className='flex items-center p-0 data-[state=open]:bg-muted h-6'
						/>
					}
				>
					<DotsThreeOutlineVerticalIcon weight='bold' className='w-4 h-4' />
					<span className='sr-only'>Open menu</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-40'>
					<DropdownMenuItem
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
							setIsEditOpen(true)
							console.log('hi')
						}}
					>
						Edit
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog
				disablePointerDismissal={true}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			>
				<DialogContent className='overflow-y-auto sm:max-w-2xl max-h-[90vh]'>
					<DialogHeader>
						<DialogTitle>Edit Ingredient</DialogTitle>
						<DialogDescription>
							Update the ingredient details.
						</DialogDescription>
					</DialogHeader>
					<IngredientEditForm
						ingredient={ingredient}
						onSuccess={() => setIsEditOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
