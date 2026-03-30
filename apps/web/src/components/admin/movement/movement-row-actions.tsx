'use client'

import { useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@fit/components/ui/alert-dialog'
import { Button } from '@fit/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@fit/components/ui/dropdown-menu'
import { orpc } from '@/utils/orpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { Row } from '@tanstack/react-table'

import {
	DotsThreeOutlineVerticalIcon,
	PencilSimpleIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MovementRowActionsProps<TData> {
	row?: Row<TData>
	movement?: {
		id: string
		name: string
		isBase: boolean
	}
	buttonClassName?: string
}

const route = getRouteApi('/$orgSlug/movements')

export function MovementRowActions<TData>({
	row,
	movement,
	buttonClassName,
}: MovementRowActionsProps<TData>) {
	const queryClient = useQueryClient()
	const navigate = route.useNavigate()
	const { orgSlug } = route.useParams()
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

	const targetMovement =
		movement ??
		(row?.original as {
			id: string
			name: string
			isBase: boolean
		})

	const deleteMovement = useMutation(
		orpc.movement.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Movement deleted successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.movement.getAllOrg.key(),
				})
				setIsDeleteConfirmOpen(false)
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const handleDelete = async () => {
		await deleteMovement.mutateAsync({ id: targetMovement.id })
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							size='icon'
							variant='ghost'
							className={buttonClassName ?? 'flex items-center h-6 p-0'}
						/>
					}
				>
					<DotsThreeOutlineVerticalIcon weight='bold' className='size-4' />
					<span className='sr-only'>Open movement actions</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-40'>
					<DropdownMenuItem
						onMouseDown={(event) => {
							event.preventDefault()
							event.stopPropagation()
							navigate({
								to: '/$orgSlug/movements/edit/$movementId',
								params: { orgSlug, movementId: targetMovement.id },
							})
						}}
					>
						<PencilSimpleIcon className='mr-2 size-4' />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={targetMovement.isBase}
						className='text-destructive focus:text-destructive'
						onMouseDown={(event) => {
							event.preventDefault()
							event.stopPropagation()
							setIsDeleteConfirmOpen(true)
						}}
					>
						<TrashIcon className='mr-2 size-4' />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog
				open={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete movement?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The movement{' '}
							<strong>{targetMovement.name}</strong> will be permanently
							deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive hover:bg-destructive/90'
							disabled={deleteMovement.isPending}
						>
							{deleteMovement.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
