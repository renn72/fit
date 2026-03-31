import { Badge } from '@fit/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'

import { recipeLibrary } from '@/content'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/recipes')({
	component: NutritionRecipesPage,
})

function NutritionRecipesPage() {
	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<p className='text-sm uppercase tracking-[0.26em] text-muted-foreground'>
					Recipe library
				</p>
				<h1 className='text-3xl font-semibold'>
					Reliable repeat meals stay one tap away.
				</h1>
				<p className='max-w-3xl text-sm leading-7 text-muted-foreground'>
					These are the recipes your coach keeps cycling because they hit the
					right macro balance without wasting prep time.
				</p>
			</div>

			<div className='grid gap-4 xl:grid-cols-2'>
				{recipeLibrary.map((recipe) => (
					<Card
						key={recipe.name}
						className='border-border/70 bg-card/80 shadow-sm backdrop-blur-sm'
					>
						<CardHeader className='gap-3'>
							<div className='flex flex-wrap items-center gap-2'>
								<Badge className='rounded-full px-3 py-1'>
									{recipe.timing}
								</Badge>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									{recipe.macros}
								</Badge>
							</div>
							<CardTitle>{recipe.name}</CardTitle>
							<CardDescription>{recipe.note}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-muted-foreground'>
								Use this as a fast default when you want plan accuracy without
								rethinking the full day.
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
