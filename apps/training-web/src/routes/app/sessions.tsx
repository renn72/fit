import { Badge } from '@fit/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'

import { upcomingSessions } from '@/content'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/sessions')({
	component: TrainingSessionsPage,
})

function TrainingSessionsPage() {
	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<p className='text-sm uppercase tracking-[0.26em] text-muted-foreground'>
					Upcoming sessions
				</p>
				<h1 className='text-3xl font-semibold'>
					The next effort should never feel ambiguous.
				</h1>
				<p className='max-w-3xl text-sm leading-7 text-muted-foreground'>
					This view keeps schedule and coaching intent side by side so athletes
					can walk into the gym with the right plan in mind.
				</p>
			</div>

			<div className='grid gap-4'>
				{upcomingSessions.map((session) => (
					<Card key={session.title}>
						<CardHeader className='gap-3'>
							<div className='flex flex-wrap items-center gap-2'>
								<Badge>{session.time}</Badge>
							</div>
							<CardTitle>{session.title}</CardTitle>
							<CardDescription>{session.note}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='rounded-xl border bg-muted p-4 text-sm text-muted-foreground'>
								Review the coaching note before the warm-up starts so intensity
								and intent stay aligned from set one.
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
