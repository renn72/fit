'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

import { ExerciseCreateForm } from './exercise-create-form'

import { PlusIcon } from 'lucide-react'

export function ExerciseCreateDialog() {
	const [open, setOpen] = React.useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className='mr-2 w-4 h-4' />
					Add Exercise
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-[600px]'>
				<DialogHeader>
					<DialogTitle>Add Exercise</DialogTitle>
					<DialogDescription>
						Create a new exercise for your organisation.
					</DialogDescription>
				</DialogHeader>
				<ScrollArea className='px-1 max-h-[80vh]'>
					<ExerciseCreateForm onSuccess={() => setOpen(false)} />
				</ScrollArea>
			</DialogContent>
		</Dialog>
	)
}
