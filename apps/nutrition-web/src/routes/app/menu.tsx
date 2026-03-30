import { Badge } from '@fit/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'

import { weeklyMenu } from '@/content'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/menu')({
	component: NutritionMenuPage,
})

function NutritionMenuPage() {
	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<p className='text-sm uppercase tracking-[0.26em] text-muted-foreground'>
					Weekly menu
				</p>
				<h1 className='text-3xl font-semibold'>
					Your meals are organized by outcome, not admin objects.
				</h1>
				<p className='max-w-3xl text-sm leading-7 text-muted-foreground'>
					This view keeps the plan readable day by day, with just enough detail
					to make shopping and execution easy.
				</p>
			</div>

			<div className='grid gap-4 xl:grid-cols-2'>
				{weeklyMenu.map((day) => (
					<Card
						key={day.day}
						className='border-white/70 bg-white/78 shadow-sm backdrop-blur-sm'
					>
						<CardHeader className='gap-3'>
							<div className='flex flex-wrap items-center justify-between gap-3'>
								<div>
									<CardTitle>{day.day}</CardTitle>
									<CardDescription>{day.focus}</CardDescription>
								</div>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									{day.calories}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className='grid gap-3'>
							{day.meals.map((meal, index) => (
								<div
									key={meal}
									className='rounded-2xl border border-border/70 bg-background/82 px-4 py-3'
								>
									<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
										Meal {index + 1}
									</p>
									<p className='mt-2 font-medium'>{meal}</p>
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
