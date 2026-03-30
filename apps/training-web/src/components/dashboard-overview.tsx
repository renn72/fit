import { Badge } from '@fit/components/ui/badge'
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

import { coachPrompts, trainingHighlights, trainingPlan } from '@/content'
import { orpc } from '@/lib/orpc'

import { useQuery } from '@tanstack/react-query'

import { Flame, Gauge, ShieldCheck } from 'lucide-react'

export function DashboardOverview() {
	const privateData = useQuery(orpc.privateData.queryOptions())
	const nextSession = trainingPlan[0]

	return (
		<div className='space-y-6'>
			<section className='grid gap-4 lg:grid-cols-[1.25fr_0.75fr]'>
				<Card className='border-white/70 bg-white/80 shadow-sm backdrop-blur-sm'>
					<CardHeader className='gap-4'>
						<div className='flex flex-wrap items-center gap-3'>
							<Badge className='rounded-full px-3 py-1'>Next session</Badge>
							<Badge variant='secondary' className='rounded-full px-3 py-1'>
								{nextSession.duration}
							</Badge>
						</div>
						<div className='space-y-2'>
							<CardTitle className='text-2xl sm:text-3xl'>
								{nextSession.focus}
							</CardTitle>
							<CardDescription className='max-w-2xl text-sm leading-7'>
								The training app keeps the intent of the session obvious so the
								client can execute instead of decoding the full program.
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent className='grid gap-3 sm:grid-cols-3'>
						{nextSession.blocks.map((block) => (
							<div
								key={block}
								className='rounded-2xl border border-border/70 bg-background/82 p-4'
							>
								<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
									Block
								</p>
								<p className='mt-2 font-medium'>{block}</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className='border-white/70 bg-white/84 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle>Connection status</CardTitle>
						<CardDescription>
							Shared auth and protected API access are already wired in.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex items-center gap-3 rounded-2xl border border-border/70 bg-background/82 p-4'>
							<ShieldCheck className='size-4 text-primary' />
							<div>
								<p className='font-medium'>
									{privateData.isLoading
										? 'Verifying access...'
										: (privateData.data?.message ??
											'Protected data unavailable')}
								</p>
								<p className='text-sm text-muted-foreground'>
									Training clients authenticate through the same FIT backend.
								</p>
							</div>
						</div>
						<Progress value={82}>
							<ProgressLabel>Readiness</ProgressLabel>
							<ProgressValue>
								{(formattedValue) =>
									formattedValue ? `${formattedValue}%` : '0%'
								}
							</ProgressValue>
						</Progress>
						<Progress value={67}>
							<ProgressLabel>Execution quality</ProgressLabel>
							<ProgressValue>
								{(formattedValue) =>
									formattedValue ? `${formattedValue}%` : '0%'
								}
							</ProgressValue>
						</Progress>
					</CardContent>
				</Card>
			</section>

			<section className='grid gap-4 lg:grid-cols-3'>
				{trainingHighlights.map((item) => (
					<Card
						key={item.label}
						className='border-white/70 bg-white/80 shadow-sm backdrop-blur-sm'
					>
						<CardHeader>
							<CardDescription>{item.label}</CardDescription>
							<CardTitle className='text-2xl'>{item.value}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-sm leading-7 text-muted-foreground'>
								{item.note}
							</p>
						</CardContent>
					</Card>
				))}
			</section>

			<section className='grid gap-4 lg:grid-cols-[0.9fr_1.1fr]'>
				<Card className='border-white/70 bg-white/80 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Flame className='size-4 text-primary' />
							Coach prompts
						</CardTitle>
						<CardDescription>
							Execution cues that travel with the athlete into the session.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3'>
						{coachPrompts.map((prompt) => (
							<div
								key={prompt}
								className='rounded-2xl border border-border/70 bg-background/82 p-4 text-sm leading-7'
							>
								{prompt}
							</div>
						))}
					</CardContent>
				</Card>

				<Card className='border-white/70 bg-white/80 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Gauge className='size-4 text-primary' />
							Block rhythm
						</CardTitle>
						<CardDescription>
							Your upcoming week is visible without exposing the admin planning
							model.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3'>
						{trainingPlan.map((day) => (
							<div
								key={day.day}
								className='flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/82 p-4 sm:flex-row sm:items-center sm:justify-between'
							>
								<div>
									<p className='text-sm font-medium'>{day.day}</p>
									<p className='text-sm text-muted-foreground'>{day.focus}</p>
								</div>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									{day.duration}
								</Badge>
							</div>
						))}
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
