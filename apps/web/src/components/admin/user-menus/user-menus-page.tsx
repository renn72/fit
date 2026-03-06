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
import { DocsLink } from '@/components/docs-link'
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
	PencilIcon,
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

// Calculate menu totals from meals
function calculateMenuTotals(meals: UserMenuWithDetails['meals']) {
	return meals.reduce(
		(acc, meal) => ({
			calories: acc.calories + (meal.calories || 0),
			protein: acc.protein + (meal.protein || 0),
			fat: acc.fat + (meal.fat || 0),
			carbohydrate: acc.carbohydrate + (meal.carbohydrate || 0),
		}),
		{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
	)
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
				<div className='flex gap-2 justify-between items-center'>
					<h1 className='text-2xl font-bold'>User Menus</h1>
					<DocsLink doc='assignMenuTemplateToUser' label='User Menu Docs' />
				</div>
				<Card className='overflow-hidden border-border/70 shadow-sm'>
					<CardContent className='py-12 text-center'>
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
				<div className='flex flex-wrap gap-3 justify-between items-center'>
					<div>
					<h1 className='text-2xl font-bold'>
						{selectedUserData?.name || 'User'}&apos;s Menus
					</h1>
						<p className='text-sm text-muted-foreground'>
							{userMenus?.length || 0} menu{userMenus?.length !== 1 ? 's' : ''}{' '}
							assigned
						</p>
					</div>
					<div className='flex gap-2 items-center'>
						<DocsLink doc='assignMenuTemplateToUser' label='User Menu Docs' />
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
				</div>

			{isLoading ? (
				<Card className='overflow-hidden border-border/70 shadow-sm'>
					<CardContent className='py-12 text-center text-muted-foreground'>
						Loading menus...
					</CardContent>
				</Card>
			) : userMenus?.length === 0 ? (
				<Card className='overflow-hidden border-border/70 shadow-sm'>
					<CardContent className='py-12 text-center'>
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
						const totals = calculateMenuTotals(typedMenu.meals || [])
						const avgCaloriesPerRecipe =
							recipeCount > 0 && totals.calories
								? Math.round(totals.calories / recipeCount)
								: 0

						return (
							<Card
								key={typedMenu.id}
								className='overflow-hidden border-border/70 shadow-sm transition-shadow bg-card hover:shadow-md flex flex-col'
							>
								<CardHeader className='space-y-3 pb-4 border-b bg-gradient-to-r from-orange-50/70 to-emerald-50/70 dark:from-orange-950/20 dark:to-emerald-950/20'>
									<div className='flex gap-2 justify-between items-start'>
										<div className='min-w-0'>
											<CardTitle className='text-lg leading-tight truncate'>
												{typedMenu.name}
											</CardTitle>
											<p className='text-xs text-muted-foreground'>
												{format(new Date(typedMenu.createdAt), 'MMM d, yyyy')}
											</p>
										</div>
										<div className='flex gap-2 items-center'>
											{typedMenu.isActive ? (
												<Badge variant='default' className='h-6'>
													Active
												</Badge>
											) : (
												<Badge variant='secondary' className='h-6'>
													Inactive
												</Badge>
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
													<DropdownMenuItem
														onClick={() =>
															navigate({
																to: '/$orgSlug/user-menu-edit/$menuId',
																params: { orgSlug, menuId: typedMenu.id },
															})
														}
														className='text-blue-600'
													>
														<PencilIcon className='mr-2 size-4' />
														Edit
													</DropdownMenuItem>
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
									<CardDescription className='line-clamp-2'>
										{typedMenu.description || 'No description'}
									</CardDescription>
								</CardHeader>

								<CardContent className='flex-1 space-y-4'>
									{/* Date Range */}
									{(typedMenu.startDate || typedMenu.endDate) && (
										<div className='text-xs text-muted-foreground'>
											{typedMenu.startDate &&
												format(new Date(typedMenu.startDate), 'MMM d, yyyy')}
											{typedMenu.startDate && typedMenu.endDate && ' - '}
											{typedMenu.endDate &&
												format(new Date(typedMenu.endDate), 'MMM d, yyyy')}
										</div>
									)}

									{/* Stats */}
									<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
										<div className='p-2 rounded-lg border bg-muted/30'>
											<div className='text-[11px] text-muted-foreground'>
												Meals
											</div>
											<div className='text-sm font-semibold'>{mealCount}</div>
										</div>
										<div className='p-2 rounded-lg border bg-muted/30'>
											<div className='text-[11px] text-muted-foreground'>
												Recipes
											</div>
											<div className='text-sm font-semibold'>{recipeCount}</div>
										</div>
										<div className='p-2 rounded-lg border bg-muted/30'>
											<div className='text-[11px] text-muted-foreground'>
												Avg Cal
											</div>
											<div className='text-sm font-semibold'>
												{avgCaloriesPerRecipe}
											</div>
										</div>
										<div className='p-2 rounded-lg border bg-muted/30'>
											<div className='text-[11px] text-muted-foreground'>
												Status
											</div>
											<div className='text-sm font-semibold'>
												{typedMenu.isActive ? 'Live' : 'Paused'}
											</div>
										</div>
									</div>

									{/* Nutrition Summary */}
									<div className='space-y-2'>
										<div className='text-sm font-medium'>Menu Nutrition</div>
										<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
											<div className='p-2 rounded-lg border bg-orange-50/80 dark:bg-orange-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Calories
												</div>
												<div className='text-sm font-semibold text-orange-700 dark:text-orange-300'>
													{Math.round(totals.calories)} kcal
												</div>
											</div>
											<div className='p-2 rounded-lg border bg-emerald-50/80 dark:bg-emerald-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Protein
												</div>
												<div className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
													{Math.round(totals.protein)} g
												</div>
											</div>
											<div className='p-2 rounded-lg border bg-blue-50/80 dark:bg-blue-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Carbs
												</div>
												<div className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
													{Math.round(totals.carbohydrate)} g
												</div>
											</div>
											<div className='p-2 rounded-lg border bg-pink-50/80 dark:bg-pink-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Fat
												</div>
												<div className='text-sm font-semibold text-pink-700 dark:text-pink-300'>
													{Math.round(totals.fat)} g
												</div>
											</div>
										</div>
									</div>

									{/* Per Recipe Average */}
									{recipeCount > 0 && (
										<div className='text-xs text-muted-foreground'>
											Avg per recipe: {avgCaloriesPerRecipe} kcal
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
