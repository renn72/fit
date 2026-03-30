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
} from '@fit/components/ui/alert-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { DocsLink } from '@/components/docs-link'
import { Button } from '@fit/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@fit/components/ui/card'
import { Checkbox } from '@fit/components/ui/checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@fit/components/ui/dropdown-menu'
import { ScrollArea } from '@fit/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@fit/components/ui/tabs'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	CookingPotIcon,
	DotsThreeOutlineVerticalIcon,
	ForkKnifeIcon,
	ListIcon,
	PencilSimpleIcon,
	SquaresFourIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { toast } from 'sonner'

interface MenuTemplateMeal {
	id: string
	mealIndex: number
	name: string
	calories?: number | null
	protein?: number | null
	fat?: number | null
	carbohydrate?: number | null
}

interface MenuTemplateRecipe {
	id: string
	mealIndex: number
	recipeIndex: number
	name: string
	category: string | null
}

interface IngredientNutrition {
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
}

interface MenuTemplateIngredient {
	id: string
	mealIndex: number
	recipeIndex: number
	serveSize: number
	ingredient: IngredientNutrition | null
}

interface Creator {
	name: string | null
}

interface MenuTemplate {
	id: string
	name: string
	description: string | null
	isTemplate: boolean
	createdAt: Date
	user?: Creator
	meals: MenuTemplateMeal[]
	recipes: MenuTemplateRecipe[]
	ingredients: MenuTemplateIngredient[]
}

interface MacroTotals {
	calories: number
	protein: number
	carbohydrate: number
	fat: number
}

const EMPTY_MACROS: MacroTotals = {
	calories: 0,
	protein: 0,
	carbohydrate: 0,
	fat: 0,
}

function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10
}

function addMacros(a: MacroTotals, b: MacroTotals): MacroTotals {
	return {
		calories: a.calories + b.calories,
		protein: a.protein + b.protein,
		carbohydrate: a.carbohydrate + b.carbohydrate,
		fat: a.fat + b.fat,
	}
}

function isZeroMacro(totals: MacroTotals): boolean {
	return (
		totals.calories === 0 &&
		totals.protein === 0 &&
		totals.carbohydrate === 0 &&
		totals.fat === 0
	)
}

function getMacroFromIngredients(
	ingredients: MenuTemplateIngredient[],
): MacroTotals {
	return ingredients.reduce((totals, item) => {
		const base = item.ingredient
		if (!base || !base.serveSize || base.serveSize <= 0) {
			return totals
		}

		const ratio = item.serveSize / base.serveSize
		return {
			calories: totals.calories + base.calories * ratio,
			protein: totals.protein + base.protein * ratio,
			carbohydrate: totals.carbohydrate + base.carbohydrate * ratio,
			fat: totals.fat + base.fat * ratio,
		}
	}, EMPTY_MACROS)
}

function formatMacro(value: number, suffix: string): string {
	return `${roundOneDecimal(value).toFixed(1)}${suffix}`
}

const columnHelper = createColumnHelper<MenuTemplate>()

const columns = [
	columnHelper.display({
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && undefined)
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
				className='translate-y-0.5'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
				className='translate-y-0.5'
			/>
		),
		enableSorting: false,
		enableHiding: false,
	}),
	columnHelper.accessor('name', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Name' />
		),
		meta: {
			label: 'Name',
			variant: 'text',
		},
		enableSorting: true,
		enableHiding: false,
	}),
	columnHelper.accessor('description', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Description' />
		),
		cell: ({ row }) => {
			const desc = row.getValue('description') as string | null
			return desc ? (desc.length > 50 ? `${desc.slice(0, 50)}...` : desc) : '-'
		},
		meta: {
			label: 'Description',
			variant: 'text',
		},
	}),
	columnHelper.accessor('isTemplate', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Template' />
		),
		cell: ({ row }) => (row.original.isTemplate ? 'Yes' : 'No'),
		meta: {
			label: 'Template',
			variant: 'text',
		},
	}),
	columnHelper.accessor('meals', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Meals' />
		),
		cell: ({ row }) => {
			const meals = row.getValue('meals') as MenuTemplateMeal[]
			const recipes = row.original.recipes
			const recipeCount = recipes?.length || 0
			return (
				<span>
					{meals?.length || 0} meals ({recipeCount} recipes)
				</span>
			)
		},
		meta: {
			label: 'Meals',
			variant: 'number',
		},
	}),
	columnHelper.accessor('user', {
		id: 'createdBy',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Created By' />
		),
		cell: ({ row }) => {
			const creator = row.original.user?.name ?? '-'
			return <span className='capitalize'>{creator}</span>
		},
		meta: {
			label: 'Created By',
			variant: 'text',
		},
	}),
	columnHelper.accessor('createdAt', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Created At' />
		),
		cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString(),
		meta: {
			label: 'Created At',
			variant: 'date',
		},
	}),
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => <MenuTemplateActions template={row.original} />,
		enableSorting: false,
		enableHiding: false,
	}),
]

const route = getRouteApi('/$orgSlug/menu-templates')

export function MenuTemplatesPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <MenuTemplatesContent userOrgId={userOrgId} />
}

function MenuTemplatesContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const navigate = route.useNavigate()
	const { view, page, perPage, sort } = route.useSearch()

	const { data: menuTemplates } = useSuspenseQuery(
		orpc.userMenu.getTemplatesOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const menuTemplatesData = (menuTemplates as unknown as MenuTemplate[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...menuTemplatesData]

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof MenuTemplate]
				const bValue = b[id as keyof MenuTemplate]

				if (aValue === bValue) return 0
				if (aValue === null || aValue === undefined) return 1
				if (bValue === null || bValue === undefined) return -1

				if (aValue < bValue) return desc ? 1 : -1
				return desc ? -1 : 1
			})
		}

		const total = processed.length
		const pageCount = Math.ceil(total / perPage)
		const start = (page - 1) * perPage
		const end = start + perPage
		const paginatedData = processed.slice(start, end)

		return { paginatedData, pageCount }
	}, [menuTemplatesData, page, perPage, sort])

	const { table } = useDataTable({
		data: paginatedData,
		columns,
		pageCount,
		getRowId: (originalRow) => originalRow.id,
		initialState: {
			sorting: sort as any,
			columnPinning: { right: ['actions'] },
		},
	})

	const handleViewChange = (newView: string) => {
		navigate({
			to: '/$orgSlug/menu-templates',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

	return (
		<div className='flex flex-col gap-4 p-4 w-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Menu Templates</h1>
				<div className='flex gap-2 items-center'>
					<DocsLink doc='createMenuTemplates' label='Template Docs' />
					<Link to='/$orgSlug/menu-templates/create' params={{ orgSlug }}>
						<Button className='cursor-pointer'>Create Menu Template</Button>
					</Link>
				</div>
			</div>

			<Tabs value={view} onValueChange={handleViewChange} className='w-full'>
				<TabsList className='w-fit'>
					<TabsTrigger value='table' className='gap-2'>
						<ListIcon className='size-4' />
						Table
					</TabsTrigger>
					<TabsTrigger value='grid' className='gap-2'>
						<SquaresFourIcon className='size-4' />
						Grid
					</TabsTrigger>
				</TabsList>

				<TabsContent value='table' className='mt-4'>
					<DataTable table={table}>
						<DataTableAdvancedToolbar table={table} className='border-b'>
							<DataTableFilterList table={table} />
						</DataTableAdvancedToolbar>
					</DataTable>
				</TabsContent>

				<TabsContent value='grid' className='mt-4'>
					<MenuTemplatesGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={menuTemplatesData.length}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

function MenuTemplateActions({
	template,
	buttonClassName,
}: {
	template: Pick<MenuTemplate, 'id' | 'name'>
	buttonClassName?: string
}) {
	const queryClient = useQueryClient()
	const navigate = route.useNavigate()
	const { orgSlug } = route.useParams()
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false)

	const deleteTemplate = useMutation(
		orpc.userMenu.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Menu template deleted successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.userMenu.getTemplatesOrg.key(),
				})
				setIsDeleteConfirmOpen(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete menu template')
			},
		}),
	)

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
								to: '/$orgSlug/menu-templates/edit/$menuId',
								params: { orgSlug, menuId: template.id },
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
						<AlertDialogTitle>Delete menu template?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The template{' '}
							<strong>{template.name}</strong> will be permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteTemplate.mutate({ id: template.id })}
							className='bg-destructive hover:bg-destructive/90'
							disabled={deleteTemplate.isPending}
						>
							{deleteTemplate.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

interface MenuTemplatesGridViewProps {
	data: MenuTemplate[]
	page: number
	perPage: number
	total: number
}

function MenuTemplatesGridView({
	data,
	page,
	perPage,
	total,
}: MenuTemplatesGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{data.map((menuTemplate) => {
					const sortedMeals = [...menuTemplate.meals].sort(
						(a, b) => a.mealIndex - b.mealIndex,
					)
					const sortedRecipes = [...menuTemplate.recipes].sort((a, b) => {
						if (a.mealIndex !== b.mealIndex) {
							return a.mealIndex - b.mealIndex
						}
						return a.recipeIndex - b.recipeIndex
					})
					const recipeCount = sortedRecipes.length
					const mealCount = sortedMeals.length

					const ingredientsByRecipeKey = new Map<
						string,
						MenuTemplateIngredient[]
					>()
					for (const ingredientItem of menuTemplate.ingredients || []) {
						const key = `${ingredientItem.mealIndex}-${ingredientItem.recipeIndex}`
						const existing = ingredientsByRecipeKey.get(key)
						if (existing) {
							existing.push(ingredientItem)
						} else {
							ingredientsByRecipeKey.set(key, [ingredientItem])
						}
					}

					const recipeMacrosByKey = new Map<string, MacroTotals>()
					for (const recipeItem of sortedRecipes) {
						const key = `${recipeItem.mealIndex}-${recipeItem.recipeIndex}`
						recipeMacrosByKey.set(
							key,
							getMacroFromIngredients(ingredientsByRecipeKey.get(key) ?? []),
						)
					}

					const mealMacrosByIndex = new Map<number, MacroTotals>()
					for (const meal of sortedMeals) {
						const mealRecipes = sortedRecipes.filter(
							(recipeItem) => recipeItem.mealIndex === meal.mealIndex,
						)

						let mealTotals = mealRecipes.reduce((totals, recipeItem) => {
							const key = `${recipeItem.mealIndex}-${recipeItem.recipeIndex}`
							return addMacros(
								totals,
								recipeMacrosByKey.get(key) ?? EMPTY_MACROS,
							)
						}, EMPTY_MACROS)

						// Fallback for older templates that may have meal-level nutrition only.
						if (isZeroMacro(mealTotals)) {
							mealTotals = {
								calories: meal.calories ?? 0,
								protein: meal.protein ?? 0,
								carbohydrate: meal.carbohydrate ?? 0,
								fat: meal.fat ?? 0,
							}
						}

						mealMacrosByIndex.set(meal.mealIndex, mealTotals)
					}

					const menuMacros = Array.from(mealMacrosByIndex.values()).reduce(
						(totals, mealTotals) => addMacros(totals, mealTotals),
						EMPTY_MACROS,
					)

					return (
						<Card
							key={menuTemplate.id}
							className='overflow-hidden shadow-sm transition-shadow hover:shadow-md border-border/70 bg-card'
						>
							<CardHeader className='pb-4 space-y-3 bg-gradient-to-r border-b from-orange-50/70 to-emerald-50/70 dark:from-orange-950/20 dark:to-emerald-950/20'>
								<div className='flex gap-3 justify-between items-start'>
									<div className='min-w-0'>
										<CardTitle className='text-lg leading-tight truncate'>
											{menuTemplate.name}
										</CardTitle>
										<p className='text-xs text-muted-foreground'>
											By {menuTemplate.user?.name ?? 'Unknown'} •{' '}
											{new Date(menuTemplate.createdAt).toLocaleDateString()}
										</p>
									</div>
									<div className='flex gap-2 shrink-0'>
										<div className='py-1 px-2 text-xs font-medium rounded-md border bg-background/80'>
											{mealCount} meals
										</div>
										<div className='py-1 px-2 text-xs font-medium rounded-md border bg-background/80'>
											{recipeCount} recipes
										</div>
										<MenuTemplateActions
											template={menuTemplate}
											buttonClassName='p-0 w-8 h-8'
										/>
									</div>
								</div>
								{menuTemplate.description && (
									<p className='text-sm leading-relaxed text-muted-foreground line-clamp-2'>
										{menuTemplate.description}
									</p>
								)}
							</CardHeader>
							<CardContent className='pt-4 space-y-4'>
								<div className='space-y-4'>
									<div>
										<div className='mb-2 text-sm font-medium'>
											Menu Nutrition
										</div>
										<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
											<div className='p-2 rounded-lg border bg-orange-50/80 dark:bg-orange-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Calories
												</div>
												<div className='text-sm font-semibold text-orange-700 dark:text-orange-300'>
													{formatMacro(menuMacros.calories, ' kcal')}
												</div>
											</div>
											<div className='p-2 rounded-lg border bg-emerald-50/80 dark:bg-emerald-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Protein
												</div>
												<div className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
													{formatMacro(menuMacros.protein, ' g')}
												</div>
											</div>
											<div className='p-2 rounded-lg border bg-blue-50/80 dark:bg-blue-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Carbs
												</div>
												<div className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
													{formatMacro(menuMacros.carbohydrate, ' g')}
												</div>
											</div>
											<div className='p-2 rounded-lg border bg-pink-50/80 dark:bg-pink-950/20'>
												<div className='text-[11px] text-muted-foreground'>
													Fat
												</div>
												<div className='text-sm font-semibold text-pink-700 dark:text-pink-300'>
													{formatMacro(menuMacros.fat, ' g')}
												</div>
											</div>
										</div>
									</div>

									<div className='space-y-3'>
										<div className='flex justify-between items-center'>
											<div className='text-sm font-medium text-muted-foreground'>
												Meal Schedule
											</div>
											<div className='text-xs text-muted-foreground'>
												Scroll for full details
											</div>
										</div>

										<ScrollArea className='h-80 rounded-xl border bg-muted/20'>
											<div className='p-3 pr-4 space-y-3'>
												{sortedMeals.map((meal) => {
													const mealRecipes = sortedRecipes.filter(
														(recipeItem) =>
															recipeItem.mealIndex === meal.mealIndex,
													)
													const mealTotals =
														mealMacrosByIndex.get(meal.mealIndex) ??
														EMPTY_MACROS

													return (
														<div
															key={meal.id}
															className='p-3 space-y-3 rounded-lg border shadow-sm bg-background'
														>
															<div className='flex gap-2 justify-between items-center'>
																<div className='flex gap-2 items-center min-w-0'>
																	<div className='p-1.5 bg-orange-100 rounded-md dark:bg-orange-950/40'>
																		<CookingPotIcon className='text-orange-600 dark:text-orange-300 size-4' />
																	</div>
																	<div className='min-w-0'>
																		<p className='text-sm font-semibold truncate'>
																			{meal.name}
																		</p>
																		<p className='text-xs text-muted-foreground'>
																			{mealRecipes.length} recipe
																			{mealRecipes.length === 1 ? '' : 's'}
																		</p>
																	</div>
																</div>
															</div>

															<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
																<div className='py-1 px-2 rounded-md border bg-orange-50/70 dark:bg-orange-950/20'>
																	<div className='uppercase text-[10px] text-muted-foreground'>
																		Cal
																	</div>
																	<div className='text-xs font-medium'>
																		{formatMacro(mealTotals.calories, ' kcal')}
																	</div>
																</div>
																<div className='py-1 px-2 rounded-md border bg-emerald-50/70 dark:bg-emerald-950/20'>
																	<div className='uppercase text-[10px] text-muted-foreground'>
																		Protein
																	</div>
																	<div className='text-xs font-medium'>
																		{formatMacro(mealTotals.protein, ' g')}
																	</div>
																</div>
																<div className='py-1 px-2 rounded-md border bg-blue-50/70 dark:bg-blue-950/20'>
																	<div className='uppercase text-[10px] text-muted-foreground'>
																		Carbs
																	</div>
																	<div className='text-xs font-medium'>
																		{formatMacro(mealTotals.carbohydrate, ' g')}
																	</div>
																</div>
																<div className='py-1 px-2 rounded-md border bg-pink-50/70 dark:bg-pink-950/20'>
																	<div className='uppercase text-[10px] text-muted-foreground'>
																		Fat
																	</div>
																	<div className='text-xs font-medium'>
																		{formatMacro(mealTotals.fat, ' g')}
																	</div>
																</div>
															</div>

															<div className='space-y-1.5'>
																{mealRecipes.map((recipeItem) => {
																	const key = `${recipeItem.mealIndex}-${recipeItem.recipeIndex}`
																	const recipeTotals =
																		recipeMacrosByKey.get(key) ?? EMPTY_MACROS

																	return (
																		<div
																			key={recipeItem.id}
																			className='flex gap-2 items-center py-1.5 px-2 rounded-md border bg-muted/30'
																		>
																			<ForkKnifeIcon className='text-emerald-600 dark:text-emerald-300 shrink-0 size-3.5' />
																			<div className='flex-1 min-w-0'>
																				<p className='text-xs font-medium truncate'>
																					{recipeItem.name}
																				</p>
																				<p className='text-[11px] text-muted-foreground'>
																					{formatMacro(
																						recipeTotals.calories,
																						' kcal',
																					)}
																					{' • '}
																					{formatMacro(
																						recipeTotals.protein,
																						' g protein',
																					)}
																					{recipeItem.category
																						? ` • ${recipeItem.category}`
																						: ''}
																				</p>
																			</div>
																		</div>
																	)
																})}
															</div>
														</div>
													)
												})}
											</div>
										</ScrollArea>
									</div>
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{totalPages > 1 && (
				<div className='flex justify-between items-center px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} menu templates
					</div>
					<div className='flex gap-2 items-center'>
						<span className='text-sm'>
							Page {page} of {totalPages}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
