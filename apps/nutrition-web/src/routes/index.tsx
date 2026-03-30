import { cn } from '@fit/components'
import { Badge } from '@fit/components/ui/badge'
import { buttonVariants } from '@fit/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'

import { BrandMark } from '@/components/brand-mark'
import { orpc } from '@/lib/orpc'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import {
	ArrowRight,
	CheckCircle2,
	Soup,
	Timer,
	WavesLadder,
} from 'lucide-react'

export const Route = createFileRoute('/')({
	component: NutritionLandingPage,
})

function NutritionLandingPage() {
	const { session } = Route.useRouteContext()
	const healthCheck = useQuery(orpc.healthCheck.queryOptions())
	const ctaTarget = session?.user ? '/app' : '/auth'
	const ctaLabel = session?.user
		? 'Open my nutrition app'
		: 'Access nutrition app'

	return (
		<div className='px-4 py-4 sm:px-6 lg:px-8'>
			<div className='mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col justify-between rounded-[2rem] border border-white/70 bg-white/66 px-6 py-6 shadow-[0_32px_90px_rgba(66,108,79,0.18)] backdrop-blur-xl sm:px-8 sm:py-8'>
				<div className='space-y-10'>
					<header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex items-center gap-4'>
							<BrandMark />
							<div>
								<p className='text-lg font-semibold'>FIT Nutrition</p>
								<p className='text-sm text-muted-foreground'>
									Client-facing nutrition planning for the FIT platform.
								</p>
							</div>
						</div>

						<div className='flex items-center gap-3'>
							<Badge variant='secondary' className='rounded-full px-3 py-1'>
								Client only
							</Badge>
							<Badge
								variant='outline'
								className='rounded-full border-white/70 bg-background/70 px-3 py-1'
							>
								{healthCheck.data ? 'Server connected' : 'Waiting for server'}
							</Badge>
						</div>
					</header>

					<section className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
						<div className='space-y-5'>
							<Badge className='rounded-full px-3 py-1'>
								<WavesLadder className='size-3.5' />
								Meal flow, recipes, check-ins
							</Badge>
							<h1 className='max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl'>
								A calmer nutrition surface built for clients, not operators.
							</h1>
							<p className='max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg'>
								Follow today&apos;s meals, revisit your repeat recipes, and keep
								weekly adherence visible without getting buried in admin
								controls.
							</p>
							<div className='flex flex-wrap gap-3'>
								<Link
									to={ctaTarget}
									className={cn(
										buttonVariants({ size: 'lg' }),
										'h-11 rounded-full px-5 shadow-[0_20px_45px_rgba(68,130,86,0.28)]',
									)}
								>
									{ctaLabel}
									<ArrowRight className='size-4' />
								</Link>
								<Link
									to='/auth'
									className={cn(
										buttonVariants({ variant: 'outline', size: 'lg' }),
										'h-11 rounded-full border-white/70 bg-background/75 px-5',
									)}
								>
									Create account
								</Link>
							</div>
						</div>

						<Card className='border-white/70 bg-white/78 shadow-sm backdrop-blur-sm'>
							<CardHeader className='gap-3'>
								<CardTitle className='text-xl'>Today at a glance</CardTitle>
								<CardDescription>
									The client app is tuned for quick reads and low-friction
									decisions.
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-3'>
								{[
									{
										icon: Soup,
										title: 'Meals staged by day',
										description:
											'See the plan you need right now, not the full CMS.',
									},
									{
										icon: Timer,
										title: 'Fast recipe recall',
										description:
											'Repeat high-performing meals without rebuilding them.',
									},
									{
										icon: CheckCircle2,
										title: 'Simple weekly check-ins',
										description:
											'Consistency stays visible for both client and coach.',
									},
								].map((item) => {
									const Icon = item.icon

									return (
										<div
											key={item.title}
											className='rounded-2xl border border-border/70 bg-background/82 p-4'
										>
											<div className='flex items-center gap-3'>
												<div className='rounded-2xl bg-primary/12 p-2 text-primary'>
													<Icon className='size-4' />
												</div>
												<div>
													<p className='font-medium'>{item.title}</p>
													<p className='text-sm text-muted-foreground'>
														{item.description}
													</p>
												</div>
											</div>
										</div>
									)
								})}
							</CardContent>
						</Card>
					</section>
				</div>
			</div>
		</div>
	)
}
