'use client'

import { useState } from 'react'

import { WarmupGroupCreateForm } from '@/components/admin/warmup-group-create-form'
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

export function WarmupGroupCreateDialog() {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size='sm' className='gap-2' />}>
				<PlusIcon /> Add Warmup
			</DialogTrigger>
			<DialogContent className='overflow-y-auto sm:max-w-2xl max-h-[90vh]'>
				<DialogHeader>
					<DialogTitle>Create Warmup</DialogTitle>
					<DialogDescription>
						Create a warmup with one or more exercises.
					</DialogDescription>
				</DialogHeader>
				<WarmupGroupCreateForm onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	)
}
