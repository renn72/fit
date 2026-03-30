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

import { coachNotes, nutritionHighlights, weeklyMenu } from '@/content'
import { orpc } from '@/lib/orpc'

import { useQuery } from '@tanstack/react-query'

import { Sparkle, TimerReset, WavesLadder } from 'lucide-react'

export function DashboardOverview() {
	const privateData = useQuery(orpc.privateData.queryOptions())
	const todayPlan = weeklyMenu[0]

	return (
		<div className='space-y-6'>
			<section className='grid gap-4 lg:grid-cols-[1.25fr_0.75fr]'>
				<Card className='border-white/70 bg-white/78 shadow-sm backdrop-blur-sm'>
					<CardHeader className='gap-4'>
						<div className='flex flex-wrap items-center gap-3'>
							<Badge className='rounded-full px-3 py-1'>Today</Badge>
							<Badge variant='secondary' className='rounded-full px-3 py-1'>
								{todayPlan.calories}
							</Badge>
						</div>
						<div className='space-y-2'>
							<CardTitle className='text-2xl sm:text-3xl'>
								{todayPlan.focus}
							</CardTitle>
							<CardDescription className='max-w-2xl text-sm leading-7'>
								Your meals today are arranged to keep energy smooth and protein
								high without making prep feel heavy.
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent className='grid gap-3 sm:grid-cols-3'>
						{todayPlan.meals.map((meal) => (
							<div
								key={meal}
								className='rounded-2xl border border-border/70 bg-background/85 p-4'
							>
								<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
									Meal
								</p>
								<p className='mt-2 font-medium'>{meal}</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className='border-white/70 bg-white/82 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle>Connection status</CardTitle>
						<CardDescription>
							Quick check that your client app and protected API are aligned.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 p-4'>
							<Sparkle className='size-4 text-primary' />
							<div>
								<p className='font-medium'>
									{privateData.isLoading
										? 'Verifying access...'
										: (privateData.data?.message ??
											'Protected data unavailable')}
								</p>
								<p className='text-sm text-muted-foreground'>
									Authenticated calls are routed through the shared FIT server.
								</p>
							</div>
						</div>
						<Progress value={78}>
							<ProgressLabel>Plan adherence</ProgressLabel>
							<ProgressValue>
								{(formattedValue) =>
									formattedValue ? `${formattedValue}%` : '0%'
								}
							</ProgressValue>
						</Progress>
						<Progress value={64}>
							<ProgressLabel>Prep readiness</ProgressLabel>
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
				{nutritionHighlights.map((item) => (
					<Card
						key={item.label}
						className='border-white/70 bg-white/74 shadow-sm backdrop-blur-sm'
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
				<Card className='border-white/70 bg-white/78 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TimerReset className='size-4 text-primary' />
							Coach notes
						</CardTitle>
						<CardDescription>
							Short reminders that keep execution tight through the week.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3'>
						{coachNotes.map((note) => (
							<div
								key={note}
								className='rounded-2xl border border-border/70 bg-background/85 p-4 text-sm leading-7'
							>
								{note}
							</div>
						))}
					</CardContent>
				</Card>

				<Card className='border-white/70 bg-white/78 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<WavesLadder className='size-4 text-primary' />
							Week rhythm
						</CardTitle>
						<CardDescription>
							Your next five days are already staged inside the client app.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3'>
						{weeklyMenu.map((day) => (
							<div
								key={day.day}
								className='flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/85 p-4 sm:flex-row sm:items-center sm:justify-between'
							>
								<div>
									<p className='text-sm font-medium'>{day.day}</p>
									<p className='text-sm text-muted-foreground'>{day.focus}</p>
								</div>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									{day.calories}
								</Badge>
							</div>
						))}
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
