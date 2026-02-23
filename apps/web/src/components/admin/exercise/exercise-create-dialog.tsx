'use client'

import { useState } from 'react'

import { ExerciseCreateForm } from '@/components/admin/exercise/exercise-create-form'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

import { useRouteContext } from '@tanstack/react-router'

import { PlusIcon } from '@phosphor-icons/react'

export function ExerciseCreateDialog() {
	const [open, setOpen] = useState(false)
	const { session } = useRouteContext({ from: '/$orgSlug/exercises' })
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return null
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size='sm' className='gap-2' />}>
				<PlusIcon /> Add Exercise
			</DialogTrigger>
			<DialogContent className='overflow-y-auto sm:max-w-2xl max-h-[90vh]'>
				<DialogHeader>
					<DialogTitle>Create Exercise</DialogTitle>
					<DialogDescription>
						Add a new exercise to your organisation.
					</DialogDescription>
				</DialogHeader>
				<ExerciseCreateForm
					onSuccess={() => setOpen(false)}
					organisationId={userOrgId}
				/>
			</DialogContent>
		</Dialog>
	)
}
