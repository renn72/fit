'use client'

import { useState } from 'react'

import { IngredientCreateForm } from '@/components/admin/ingredient-create-form'
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

export function IngredientCreateDialog() {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size='sm' className='gap-2' />}>
				<PlusIcon /> Add Ingredient
			</DialogTrigger>
			<DialogContent className='overflow-y-auto sm:max-w-2xl max-h-[90vh]'>
				<DialogHeader>
					<DialogTitle>Create Ingredient</DialogTitle>
					<DialogDescription>
						Add a new ingredient to your organisation.
					</DialogDescription>
				</DialogHeader>
				<IngredientCreateForm onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	)
}
