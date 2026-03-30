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

interface WarmupRowActionsProps<TData> {
	row?: Row<TData>
	group?: {
		id: string
		name: string
	}
	buttonClassName?: string
}

const route = getRouteApi('/$orgSlug/warmups')

export function WarmupRowActions<TData>({
	row,
	group,
	buttonClassName,
}: WarmupRowActionsProps<TData>) {
	const queryClient = useQueryClient()
	const navigate = route.useNavigate()
	const { orgSlug } = route.useParams()
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

	const targetGroup =
		group ??
		(row?.original as {
			id: string
			name: string
		})

	const deleteGroup = useMutation(
		orpc.warmup.deleteGroup.mutationOptions({
			onSuccess: () => {
				toast.success('Warmup group deleted successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.warmup.getAllGroups.key(),
				})
				setIsDeleteConfirmOpen(false)
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const handleDelete = async () => {
		await deleteGroup.mutateAsync({ id: targetGroup.id })
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
					<span className='sr-only'>Open warmup actions</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-40'>
					<DropdownMenuItem
						onMouseDown={(event) => {
							event.preventDefault()
							event.stopPropagation()
							navigate({
								to: '/$orgSlug/warmups/edit/$warmupGroupId',
								params: { orgSlug, warmupGroupId: targetGroup.id },
							})
						}}
					>
						<PencilSimpleIcon className='mr-2 size-4' />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
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
						<AlertDialogTitle>Delete warmup group?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The warmup group{' '}
							<strong>{targetGroup.name}</strong> will be permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive hover:bg-destructive/90'
							disabled={deleteGroup.isPending}
						>
							{deleteGroup.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
