'use client'

import { useState } from 'react'

import { PlanCreateForm } from '@/components/dictator/plans/plan-create-form'
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

export function PlanCreateDialog() {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size='sm' className='gap-2' />}>
				<PlusIcon /> Create Plan
			</DialogTrigger>
			<DialogContent className='overflow-y-auto sm:max-w-2xl max-h-[90vh]'>
				<DialogHeader>
					<DialogTitle>Create Plan</DialogTitle>
					<DialogDescription>
						Add a new subscription plan to the platform.
					</DialogDescription>
				</DialogHeader>
				<PlanCreateForm onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	)
}
