'use client'

import { useState } from 'react'

import { ExerciseEditForm } from '@/components/admin/exercise-edit-form'
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

import { DotsThreeOutlineIcon } from '@phosphor-icons/react'

interface Exercise {
	id: string
	name: string
	category: string | null
	level: string | null
	force: string | null
	mechanic: string | null
	equipment: string | null
	primaryMuscles: string | null
	secondaryMuscles: string | null
	instructions: string | null
	images: string | null
}

interface ExerciseRowActionsProps<TData> {
	row: Row<TData>
}

export function ExerciseRowActions<TData>({
	row,
}: ExerciseRowActionsProps<TData>) {
	const [isEditOpen, setIsEditOpen] = useState(false)
	const exercise = row.original as Exercise

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant='ghost'
							className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
						/>
					}
				>
					<DotsThreeOutlineIcon weight='bold' className='w-4 h-4' />
					<span className='sr-only'>Open menu</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-[160px]'>
					<DropdownMenuItem onMouseDown={() => setIsEditOpen(true)}>
						Edit
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				disablePointerDismissal={true}
			>
				<DialogContent className='overflow-y-auto sm:max-w-2xl max-h-[90vh]'>
					<DialogHeader>
						<DialogTitle>Edit Exercise</DialogTitle>
						<DialogDescription>Update the exercise details.</DialogDescription>
					</DialogHeader>
					<ExerciseEditForm
						exercise={exercise}
						onSuccess={() => setIsEditOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
