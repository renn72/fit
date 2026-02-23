'use client'

import { useState } from 'react'

import { WorkoutCreateForm } from '@/components/admin/workout/workout-create-form'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

import { PlusIcon } from '@phosphor-icons/react'

export function WorkoutCreateDialog() {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size='sm' className='gap-2' />}>
				<PlusIcon /> Create Workout
			</DialogTrigger>
			<DialogContent className='overflow-y-auto sm:max-w-2xl max-h-[90vh]'>
				<DialogHeader>
					<DialogTitle>Create Workout</DialogTitle>
					<DialogDescription>
						Create a new workout with exercises, supersets, and optional warmup.
					</DialogDescription>
				</DialogHeader>
				<WorkoutCreateForm onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	)
}
