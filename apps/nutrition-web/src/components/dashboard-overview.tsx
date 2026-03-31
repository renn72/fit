import { Badge } from '@fit/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'

import { orpc } from '@/lib/orpc'
import type { AppSession } from '@/lib/session'

import { useQuery } from '@tanstack/react-query'

import { Leaf, Soup, Sparkles, SwatchBook } from 'lucide-react'

type DashboardOverviewProps = {
	session: AppSession
}

function formatMacro(value: number | null | undefined, suffix: string) {
	if (value == null) {
		return `0${suffix}`
	}

	return `${Math.round(value)}${suffix}`
}

function selectCurrentMenu<
	T extends {
		isTemplate?: boolean
		isActive?: boolean
		createdAt?: Date | string | null
	},
>(menus: T[]) {
	const assignedMenus = menus.filter((menu) => menu.isTemplate !== true)
	return assignedMenus.find((menu) => menu.isActive) ?? assignedMenus[0] ?? null
}

export function DashboardOverview({ session }: DashboardOverviewProps) {
	const userId = session?.user?.id ?? ''
	const { data, error, isPending } = useQuery(
		orpc.userMenu.getByUser.queryOptions({
			input: { userId },
			enabled: !!userId,
		}),
	)

	const menus = data ?? []
	const currentMenu = selectCurrentMenu(menus)

	if (isPending) {
		return (
			<div className='space-y-4'>
				<Card className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle>Loading current menu...</CardTitle>
						<CardDescription>
							Forma is pulling the latest nutrition plan assigned to you.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	if (error) {
		return (
			<Card className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'>
				<CardHeader>
					<CardTitle>Current menu unavailable</CardTitle>
					<CardDescription>
						We could not load your current menu right now. Try again shortly.
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	if (!currentMenu) {
		return (
			<Card className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'>
				<CardHeader>
					<CardTitle>No current menu yet</CardTitle>
					<CardDescription>
						Your coach has not assigned an active menu yet. Once it is live, it
						will show up here first.
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	const meals = [...(currentMenu.meals ?? [])].sort(
		(left, right) => left.mealIndex - right.mealIndex,
	)

	return (
		<div className='space-y-4'>
			<Card className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'>
				<CardHeader className='gap-4'>
					<div className='flex flex-wrap items-center gap-2'>
						<Badge className='rounded-full px-3 py-1'>Current menu</Badge>
						<Badge variant='secondary' className='rounded-full px-3 py-1'>
							{currentMenu.isActive ? 'Active' : 'Assigned'}
						</Badge>
					</div>
					<div className='space-y-2'>
						<CardTitle className='text-2xl'>{currentMenu.name}</CardTitle>
						<CardDescription className='leading-7'>
							{currentMenu.description ||
								'Your current menu is staged here so you can follow the plan without opening admin tools.'}
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className='grid gap-3 sm:grid-cols-3'>
					<SummaryTile icon={Soup} label='Meals' value={String(meals.length)} />
					<SummaryTile
						icon={SwatchBook}
						label='Recipes'
						value={String(currentMenu.recipes?.length ?? 0)}
					/>
					<SummaryTile
						icon={Leaf}
						label='Menu status'
						value={currentMenu.isActive ? 'Live' : 'Queued'}
					/>
				</CardContent>
			</Card>

			<Card className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'>
				<CardHeader>
					<CardTitle>Meal flow</CardTitle>
					<CardDescription>
						Each meal is listed in order so today&apos;s plan stays obvious on
						mobile.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-3'>
					{meals.map((meal) => {
						const recipeCount =
							currentMenu.recipes?.filter(
								(recipe) => recipe.mealIndex === meal.mealIndex,
							).length ?? 0

						return (
							<div
								key={meal.id}
								className='rounded-3xl border border-border/70 bg-background/84 p-4'
							>
								<div className='flex items-start justify-between gap-3'>
									<div>
										<p className='text-sm font-medium'>
											{meal.name || `Meal ${meal.mealIndex + 1}`}
										</p>
										<p className='mt-1 text-sm text-muted-foreground'>
											{recipeCount} recipes in this slot
										</p>
									</div>
									<Badge variant='outline' className='rounded-full px-3 py-1'>
										Meal {meal.mealIndex + 1}
									</Badge>
								</div>
								<div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
									<MacroPill
										label='Calories'
										value={formatMacro(meal.calories, 'kcal')}
									/>
									<MacroPill
										label='Protein'
										value={formatMacro(meal.protein, 'g')}
									/>
									<MacroPill
										label='Carbs'
										value={formatMacro(meal.carbohydrate, 'g')}
									/>
									<MacroPill label='Fat' value={formatMacro(meal.fat, 'g')} />
								</div>
							</div>
						)
					})}
				</CardContent>
			</Card>

			<Card className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Sparkles className='size-4 text-primary' />
						Client note
					</CardTitle>
					<CardDescription>
						Your coach can keep the structure steady while you use the dock to
						jump between today, the full menu, recipes, and check-ins.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	)
}

function SummaryTile({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Leaf
	label: string
	value: string
}) {
	return (
		<div className='rounded-3xl border border-border/70 bg-background/84 p-4'>
			<div className='flex items-center gap-3'>
				<div className='rounded-2xl bg-primary/12 p-2 text-primary'>
					<Icon className='size-4' />
				</div>
				<div>
					<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
						{label}
					</p>
					<p className='mt-1 text-lg font-semibold'>{value}</p>
				</div>
			</div>
		</div>
	)
}

function MacroPill({ label, value }: { label: string; value: string }) {
	return (
		<div className='rounded-2xl border border-border/70 bg-card/80 px-3 py-2'>
			<p className='text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground'>
				{label}
			</p>
			<p className='mt-1 text-sm font-medium'>{value}</p>
		</div>
	)
}
