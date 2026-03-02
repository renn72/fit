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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface WorkoutRef {
	id: string
	name: string
}

interface WorkoutRowActionsProps<TData> {
	row?: Row<TData>
	workout?: WorkoutRef
	buttonClassName?: string
}

const route = getRouteApi('/$orgSlug/workouts')

export function WorkoutRowActions<TData>({
	row,
	workout,
	buttonClassName,
}: WorkoutRowActionsProps<TData>) {
	const queryClient = useQueryClient()
	const navigate = route.useNavigate()
	const { orgSlug } = route.useParams()
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

	const targetWorkout =
		workout ??
		(row?.original as {
			id: string
			name: string
		})

	const deleteWorkout = useMutation(
		orpc.workout.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Workout deleted successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.workout.getAllOrg.key(),
				})
				setIsDeleteConfirmOpen(false)
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const handleDelete = async () => {
		await deleteWorkout.mutateAsync({ id: targetWorkout.id })
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
					<span className='sr-only'>Open workout actions</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-40'>
					<DropdownMenuItem
						onMouseDown={(event) => {
							event.preventDefault()
							event.stopPropagation()
							navigate({
								to: '/$orgSlug/workouts/edit/$workoutId',
								params: { orgSlug, workoutId: targetWorkout.id },
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
						<AlertDialogTitle>Delete workout?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The workout{' '}
							<strong>{targetWorkout.name}</strong> will be permanently
							deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive hover:bg-destructive/90'
							disabled={deleteWorkout.isPending}
						>
							{deleteWorkout.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
