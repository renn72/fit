'use client'

import * as React from 'react'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { orpc } from '@/utils/orpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

import {
	DotsThreeIcon,
	PlayIcon,
	StopIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface UserMenuWithDetails {
	id: string
	name: string
	description: string | null
	startDate: Date | null
	endDate: Date | null
	isActive: boolean
	totalCalories: number | null
	totalProtein: number | null
	totalFat: number | null
	totalCarbohydrate: number | null
	createdAt: Date
	meals: Array<{
		id: string
		name: string | null
		mealIndex: number
		calories: number
		protein: number
		fat: number
		carbohydrate: number
	}>
	recipes: Array<{
		id: string
		name: string
		mealIndex: number
		recipeIndex: number
		calories: number
		protein: number
		fat: number
		carbohydrate: number
	}>
}

interface UserMenusPageProps {
	orgSlug: string
}

export function UserMenusPage({ orgSlug }: UserMenusPageProps) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { user } = useSearch({ from: '/$orgSlug' })

	// Get user from parent route search params
	const selectedUser = user || null

	// State for delete confirmation
	const [menuToDelete, setMenuToDelete] = React.useState<string | null>(null)

	// Get all users in the org for the selector
	const { data: usersData } = useQuery(orpc.user.getAllByOrg.queryOptions())
	const users =
		usersData?.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			image: u.image,
		})) ?? []

	// Get user menus when a user is selected
	const { data: userMenus, isLoading } = useQuery(
		orpc.userMenu.getByUser.queryOptions({
			input: { userId: selectedUser || '' },
			enabled: !!selectedUser,
		}),
	)

	// Update menu mutation (for activate/deactivate)
	const updateMenuMutation = useMutation({
		...orpc.userMenu.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.userMenu.getByUser.key(),
			})
			toast.success('Menu updated successfully')
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to update menu')
		},
	})

	// Delete menu mutation
	const deleteMenuMutation = useMutation({
		...orpc.userMenu.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.userMenu.getByUser.key(),
			})
			toast.success('Menu deleted successfully')
			setMenuToDelete(null)
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to delete menu')
			setMenuToDelete(null)
		},
	})

	const handleActivate = (menuId: string) => {
		updateMenuMutation.mutate({
			id: menuId,
			isActive: true,
		})
	}

	const handleDeactivate = (menuId: string) => {
		updateMenuMutation.mutate({
			id: menuId,
			isActive: false,
		})
	}

	const handleDelete = (menuId: string) => {
		setMenuToDelete(menuId)
	}

	const confirmDelete = () => {
		if (menuToDelete) {
			deleteMenuMutation.mutate({ id: menuToDelete })
		}
	}

	if (!selectedUser) {
		return (
			<div className='flex flex-col gap-6 p-8'>
				<h1 className='text-2xl font-bold'>User Menus</h1>
				<Card>
					<CardContent className='p-8 text-center'>
						<p className='text-muted-foreground'>
							Please select a user from the sidebar to view their menus.
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	const selectedUserData = users.find((u) => u.id === selectedUser)

	return (
		<div className='flex flex-col gap-6 p-8'>
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-2xl font-bold'>
						{selectedUserData?.name || 'User'}&apos;s Menus
					</h1>
					<p className='text-sm text-muted-foreground'>
						{userMenus?.length || 0} menu{userMenus?.length !== 1 ? 's' : ''}{' '}
						assigned
					</p>
				</div>
				<Button
					onClick={() =>
						navigate({
							to: '/$orgSlug/user-menu-create',
							params: { orgSlug },
							search: { user: selectedUser },
						})
					}
				>
					Create Menu
				</Button>
			</div>

			{isLoading ? (
				<div className='text-center text-muted-foreground'>
					Loading menus...
				</div>
			) : userMenus?.length === 0 ? (
				<Card>
					<CardContent className='p-8 text-center'>
						<p className='text-muted-foreground'>
							No menus assigned to this user yet.
						</p>
						<Button
							className='mt-4'
							onClick={() =>
								navigate({
									to: '/$orgSlug/user-menu-create',
									params: { orgSlug },
									search: { user: selectedUser },
								})
							}
						>
							Create First Menu
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
					{userMenus?.map((menu) => {
						const typedMenu = menu as unknown as UserMenuWithDetails
						const mealCount = typedMenu.meals?.length || 0
						const recipeCount = typedMenu.recipes?.length || 0
						const avgCaloriesPerRecipe =
							recipeCount > 0 && typedMenu.totalCalories
								? Math.round(typedMenu.totalCalories / recipeCount)
								: 0

						return (
							<Card key={typedMenu.id} className='flex flex-col'>
								<CardHeader>
									<div className='flex gap-2 justify-between items-start'>
										<CardTitle className='text-lg'>{typedMenu.name}</CardTitle>
										<div className='flex gap-2 items-center'>
											{typedMenu.isActive ? (
												<Badge variant='default'>Active</Badge>
											) : (
												<Badge variant='secondary'>Inactive</Badge>
											)}
											<DropdownMenu>
												<DropdownMenuTrigger
													render={
														<Button
															variant='ghost'
															size='sm'
															className='p-0 w-8 h-8'
														/>
													}
												>
													<DotsThreeIcon className='size-4' />
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end'>
													{typedMenu.isActive ? (
														<DropdownMenuItem
															onClick={() => handleDeactivate(typedMenu.id)}
															className='text-yellow-600'
														>
															<StopIcon className='mr-2 size-4' />
															Deactivate
														</DropdownMenuItem>
													) : (
														<DropdownMenuItem
															onClick={() => handleActivate(typedMenu.id)}
															className='text-green-600'
														>
															<PlayIcon className='mr-2 size-4' />
															Activate
														</DropdownMenuItem>
													)}
													<DropdownMenuItem
														onClick={() => handleDelete(typedMenu.id)}
														className='text-red-600'
													>
														<TrashIcon className='mr-2 size-4' />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
									<CardDescription>
										{typedMenu.description || 'No description'}
									</CardDescription>
								</CardHeader>

								<CardContent className='flex-1 space-y-4'>
									{/* Date Range */}
									{(typedMenu.startDate || typedMenu.endDate) && (
										<div className='text-sm text-muted-foreground'>
											{typedMenu.startDate &&
												format(new Date(typedMenu.startDate), 'MMM d, yyyy')}
											{typedMenu.startDate && typedMenu.endDate && ' - '}
											{typedMenu.endDate &&
												format(new Date(typedMenu.endDate), 'MMM d, yyyy')}
										</div>
									)}

									{/* Stats */}
									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<div className='text-muted-foreground'>Meals</div>
											<div className='font-medium'>{mealCount}</div>
										</div>
										<div>
											<div className='text-muted-foreground'>Recipes</div>
											<div className='font-medium'>{recipeCount}</div>
										</div>
									</div>

									{/* Nutrition Summary */}
									<div className='p-3 space-y-2 rounded-lg bg-muted/50'>
										<div className='text-xs font-medium text-muted-foreground'>
											Daily Nutrition
										</div>
										<div className='grid grid-cols-2 gap-2 text-sm'>
											<div>
												<span className='text-muted-foreground'>Calories:</span>{' '}
												<span className='font-medium'>
													{Math.round(typedMenu.totalCalories || 0)}
												</span>
											</div>
											<div>
												<span className='text-muted-foreground'>Protein:</span>{' '}
												<span className='font-medium'>
													{Math.round(typedMenu.totalProtein || 0)}g
												</span>
											</div>
											<div>
												<span className='text-muted-foreground'>Fat:</span>{' '}
												<span className='font-medium'>
													{Math.round(typedMenu.totalFat || 0)}g
												</span>
											</div>
											<div>
												<span className='text-muted-foreground'>Carbs:</span>{' '}
												<span className='font-medium'>
													{Math.round(typedMenu.totalCarbohydrate || 0)}g
												</span>
											</div>
										</div>
									</div>

									{/* Per Recipe Average */}
									{recipeCount > 0 && (
										<div className='text-sm text-muted-foreground'>
											Avg per recipe: {avgCaloriesPerRecipe} cal
										</div>
									)}
								</CardContent>

								<CardFooter className='flex gap-2 pt-4 border-t'>
									<Button
										variant='outline'
										className='w-full'
										onClick={() =>
											navigate({
												to: '/$orgSlug/user-menu/$menuId',
												params: { orgSlug, menuId: typedMenu.id },
											})
										}
									>
										View Details
									</Button>
								</CardFooter>
							</Card>
						)
					})}
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!menuToDelete}
				onOpenChange={() => setMenuToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							menu and all associated meals, recipes, and ingredients.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setMenuToDelete(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className='bg-red-600 hover:bg-red-700'
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
