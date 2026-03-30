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

import { DotsThreeOutlineVerticalIcon, TrashIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Ingredient {
	id: string
	name: string
	isBase: boolean
}

interface IngredientRowActionsProps<TData> {
	row: Row<TData>
}

const route = getRouteApi('/$orgSlug/ingredients')

export function IngredientRowActions<TData>({
	row,
}: IngredientRowActionsProps<TData>) {
	const queryClient = useQueryClient()
	const navigate = route.useNavigate()
	const { orgSlug } = route.useParams()
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
	const ingredient = row.original as Ingredient

	const deleteIngredient = useMutation(
		orpc.ingredient.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Ingredient deleted successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.ingredient.getAllOrg.key(),
				})
				setIsDeleteConfirmOpen(false)
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const handleDelete = async () => {
		await deleteIngredient.mutateAsync({ id: ingredient.id })
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							size='icon'
							variant='ghost'
							className='flex items-center p-0 data-[state=open]:bg-muted h-6'
						/>
					}
				>
					<DotsThreeOutlineVerticalIcon weight='bold' className='w-4 h-4' />
					<span className='sr-only'>Open menu</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-40'>
					<DropdownMenuItem
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
							navigate({
								to: '/$orgSlug/ingredients/edit/$ingredientId',
								params: { orgSlug, ingredientId: ingredient.id },
							})
						}}
					>
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={ingredient.isBase}
						className='text-destructive focus:text-destructive'
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
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
						<AlertDialogTitle>Delete ingredient?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The ingredient{' '}
							<strong>{ingredient.name}</strong> will be permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive hover:bg-destructive/90'
							disabled={deleteIngredient.isPending}
						>
							{deleteIngredient.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
