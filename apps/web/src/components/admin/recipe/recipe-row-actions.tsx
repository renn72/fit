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

import {
	DotsThreeOutlineVerticalIcon,
	PencilSimpleIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface RecipeRowActionsProps {
	recipe: {
		id: string
		name: string
	}
	buttonClassName?: string
}

const route = getRouteApi('/$orgSlug/recipes')

export function RecipeRowActions({
	recipe,
	buttonClassName,
}: RecipeRowActionsProps) {
	const queryClient = useQueryClient()
	const navigate = route.useNavigate()
	const { orgSlug } = route.useParams()
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

	const deleteRecipe = useMutation(
		orpc.recipe.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Recipe deleted successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.recipe.getOrg.key(),
				})
				setIsDeleteConfirmOpen(false)
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const handleDelete = async () => {
		await deleteRecipe.mutateAsync({ id: recipe.id })
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							size='icon'
							variant='ghost'
							className={buttonClassName ?? 'flex items-center p-0 h-6'}
						/>
					}
				>
					<DotsThreeOutlineVerticalIcon weight='bold' className='size-4' />
					<span className='sr-only'>Open menu</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-40'>
					<DropdownMenuItem
						onMouseDown={(event) => {
							event.preventDefault()
							event.stopPropagation()
							navigate({
								to: '/$orgSlug/recipes/edit/$recipeId',
								params: { orgSlug, recipeId: recipe.id },
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
						<AlertDialogTitle>Delete recipe?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The recipe{' '}
							<strong>{recipe.name}</strong> will be permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive hover:bg-destructive/90'
							disabled={deleteRecipe.isPending}
						>
							{deleteRecipe.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
