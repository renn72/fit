'use client'

import { useState } from 'react'

import { PlanEditForm } from '@/components/dictator/plans/plan-edit-form'
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
import { orpc } from '@/utils/orpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Row } from '@tanstack/react-table'

import { DotsThreeOutlineVerticalIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Plan {
	id: string
	name: string
	description: string
	features: string
	cta: string
	priceMonthly: number
	priceYearly: number
	maxMembers: number
	maxTrainers: number
	tags: string
	hidden: boolean
}

interface PlanRowActionsProps<TData> {
	row: Row<TData>
}

export function PlanRowActions<TData>({ row }: PlanRowActionsProps<TData>) {
	const [isEditOpen, setIsEditOpen] = useState(false)
	const plan = row.original as Plan
	const queryClient = useQueryClient()

	const deletePlan = useMutation(
		orpc.organisation.deletePlan.mutationOptions({
			onSuccess: () => {
				toast.success('Plan deleted successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.organisation.getAllPlansAdmin.key(),
				})
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const handleDelete = () => {
		if (window.confirm(`Are you sure you want to delete "${plan.name}"?`)) {
			deletePlan.mutate({ id: plan.id })
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							size='icon'
							variant='ghost'
							className='flex items-start p-0 data-[state=open]:bg-muted'
						/>
					}
				>
					<DotsThreeOutlineVerticalIcon weight='bold' className='w-4 h-4' />
					<span className='sr-only'>Open menu</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-[160px]'>
					<DropdownMenuItem
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
							setIsEditOpen(true)
						}}
					>
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
							handleDelete()
						}}
						className='text-destructive'
					>
						Delete
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
						<DialogTitle>Edit Plan</DialogTitle>
						<DialogDescription>Update the plan details.</DialogDescription>
					</DialogHeader>
					<PlanEditForm plan={plan} onSuccess={() => setIsEditOpen(false)} />
				</DialogContent>
			</Dialog>
		</>
	)
}
