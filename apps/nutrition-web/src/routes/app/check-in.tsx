import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'
import {
	Progress,
	ProgressLabel,
	ProgressValue,
} from '@fit/components/ui/progress'

import { checkInMetrics, coachNotes } from '@/content'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/check-in')({
	component: NutritionCheckInPage,
})

function NutritionCheckInPage() {
	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<p className='text-sm uppercase tracking-[0.26em] text-muted-foreground'>
					Check-in
				</p>
				<h1 className='text-3xl font-semibold'>
					Your weekly signals, condensed.
				</h1>
				<p className='max-w-3xl text-sm leading-7 text-muted-foreground'>
					Clients should not need a spreadsheet to understand whether the plan
					is working. This page keeps the feedback loop short.
				</p>
			</div>

			<div className='grid gap-4 lg:grid-cols-3'>
				{checkInMetrics.map((metric) => (
					<Card key={metric.label}>
						<CardHeader>
							<CardDescription>{metric.label}</CardDescription>
							<CardTitle className='text-2xl'>{metric.value}%</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<Progress value={metric.value}>
								<ProgressLabel>{metric.label}</ProgressLabel>
								<ProgressValue>
									{(formattedValue) =>
										formattedValue ? `${formattedValue}%` : '0%'
									}
								</ProgressValue>
							</Progress>
							<p className='text-sm leading-7 text-muted-foreground'>
								{metric.caption}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Next adjustments</CardTitle>
					<CardDescription>
						Keep the next change narrow so it is easy to measure.
					</CardDescription>
				</CardHeader>
				<CardContent className='grid gap-3'>
					{coachNotes.map((note) => (
						<div
							key={note}
							className='rounded-xl border bg-muted p-4 text-sm leading-7'
						>
							{note}
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
