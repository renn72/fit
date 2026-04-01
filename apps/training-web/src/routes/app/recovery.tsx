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

import { coachPrompts, recoveryMetrics } from '@/content'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/recovery')({
	component: TrainingRecoveryPage,
})

function TrainingRecoveryPage() {
	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<p className='text-sm uppercase tracking-[0.26em] text-muted-foreground'>
					Recovery
				</p>
				<h1 className='text-3xl font-semibold'>
					Training readiness should guide the day, not surprise it.
				</h1>
				<p className='max-w-3xl text-sm leading-7 text-muted-foreground'>
					This screen compresses the recovery signal into a client-readable
					format that still leaves room for coach nuance.
				</p>
			</div>

			<div className='grid gap-4 lg:grid-cols-3'>
				{recoveryMetrics.map((metric) => (
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
					<CardTitle>Coach prompts</CardTitle>
					<CardDescription>
						Keep recovery adjustments specific so the athlete can act on them.
					</CardDescription>
				</CardHeader>
				<CardContent className='grid gap-3'>
					{coachPrompts.map((prompt) => (
						<div
							key={prompt}
							className='rounded-xl border bg-muted p-4 text-sm leading-7'
						>
							{prompt}
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
