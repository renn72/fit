import { Badge } from '@fit/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'

import { trainingPlan } from '@/content'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/plan')({
	component: TrainingPlanPage,
})

function TrainingPlanPage() {
	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<p className='text-sm uppercase tracking-[0.26em] text-muted-foreground'>
					Current block
				</p>
				<h1 className='text-3xl font-semibold'>
					The week is framed around outcomes, not programming jargon.
				</h1>
				<p className='max-w-3xl text-sm leading-7 text-muted-foreground'>
					Clients should see what each day is for, how long it should take, and
					which parts of the session deserve attention.
				</p>
			</div>

			<div className='grid gap-4 xl:grid-cols-2'>
				{trainingPlan.map((day) => (
					<Card
						key={day.day}
						className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'
					>
						<CardHeader className='gap-3'>
							<div className='flex flex-wrap items-center justify-between gap-3'>
								<div>
									<CardTitle>{day.day}</CardTitle>
									<CardDescription>{day.focus}</CardDescription>
								</div>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									{day.duration}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className='grid gap-3'>
							{day.blocks.map((block, index) => (
								<div
									key={block}
									className='rounded-2xl border border-border/70 bg-background/84 px-4 py-3'
								>
									<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
										Block {index + 1}
									</p>
									<p className='mt-2 font-medium'>{block}</p>
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
