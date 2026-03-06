'use client'

import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { orpc } from '@/utils/orpc'

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'

import { toast } from 'sonner'

const AI_ENABLED_TAG = 'aiEnabled'
const AI_NUTRITION_ENABLED_TAG = 'aiNutritionEnabled'

function parseMetaTags(metaTags: string | null | undefined): string[] {
	return (metaTags ?? '')
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean)
}

function buildMetaTagsCsv(tags: string[]): string {
	return Array.from(new Set(tags)).join(',')
}

function hasTag(metaTags: string | null | undefined, tag: string): boolean {
	return parseMetaTags(metaTags).includes(tag)
}

export function OrgFeatureMetaTagsPage() {
	const queryClient = useQueryClient()
	const { data: organisations } = useSuspenseQuery(
		orpc.organisation.getAll.queryOptions({}),
	)

	const [updatingOrgId, setUpdatingOrgId] = React.useState<string | null>(null)

	const updateOrgMetaTags = useMutation(
		orpc.organisation.updateMetaTags.mutationOptions({
			onMutate: (variables) => {
				setUpdatingOrgId(variables.organisationId)
			},
			onSuccess: () => {
				toast.success('Organisation meta tags updated')
				queryClient.invalidateQueries({
					queryKey: orpc.organisation.getAll.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.feature.getAiAccess.key(),
				})
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update organisation meta tags')
			},
			onSettled: () => {
				setUpdatingOrgId(null)
			},
		}),
	)

	const toggleTag = async (
		orgId: string,
		currentMetaTags: string | null | undefined,
		tag: string,
		enabled: boolean,
	) => {
		const tags = parseMetaTags(currentMetaTags)
		const nextTags = enabled
			? [...tags, tag]
			: tags.filter((existingTag) => existingTag !== tag)

		await updateOrgMetaTags.mutateAsync({
			organisationId: orgId,
			metaTags: buildMetaTagsCsv(nextTags),
		})
	}

	return (
		<div className='mx-auto w-full max-w-6xl space-y-4'>
			<div>
				<h1 className='text-2xl font-bold'>Organisation Feature Meta Tags</h1>
				<p className='text-sm text-muted-foreground'>
					Grant AI access per organisation by setting meta tags. Plan meta tags
					are read-only here and also contribute to effective access.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Organisation Meta Tags</CardTitle>
				</CardHeader>
				<CardContent>
					<ScrollArea className='h-[68vh]'>
						<div className='space-y-3'>
							{organisations.map((org) => {
								const orgHasAiEnabled = hasTag(org.metaTags, AI_ENABLED_TAG)
								const orgHasAiNutritionEnabled = hasTag(
									org.metaTags,
									AI_NUTRITION_ENABLED_TAG,
								)
								const planHasAiEnabled = hasTag(
									org.planMetaTags,
									AI_ENABLED_TAG,
								)
								const planHasAiNutritionEnabled = hasTag(
									org.planMetaTags,
									AI_NUTRITION_ENABLED_TAG,
								)

								const isUpdating = updatingOrgId === org.id

								return (
									<div key={org.id} className='space-y-3 rounded-lg border p-4'>
										<div className='flex flex-wrap items-center justify-between gap-2'>
											<div>
												<div className='font-medium'>{org.name}</div>
												<div className='text-xs text-muted-foreground'>
													{org.slug} • Plan: {org.planName}
												</div>
											</div>
											<div className='flex gap-2'>
												<Badge variant='outline'>
													Org tags: {org.metaTags || 'none'}
												</Badge>
												<Badge variant='secondary'>
													Plan tags: {org.planMetaTags || 'none'}
												</Badge>
											</div>
										</div>

										<div className='grid gap-3 md:grid-cols-2'>
											<div className='flex items-center justify-between rounded-md border p-3'>
												<div className='space-y-1'>
													<Label>aiEnabled</Label>
													<p className='text-xs text-muted-foreground'>
														Plan grants: {planHasAiEnabled ? 'Yes' : 'No'}
													</p>
												</div>
												<Switch
													disabled={isUpdating}
													checked={orgHasAiEnabled}
													onCheckedChange={(checked) => {
														void toggleTag(
															org.id,
															org.metaTags,
															AI_ENABLED_TAG,
															checked === true,
														)
													}}
												/>
											</div>

											<div className='flex items-center justify-between rounded-md border p-3'>
												<div className='space-y-1'>
													<Label>aiNutritionEnabled</Label>
													<p className='text-xs text-muted-foreground'>
														Plan grants:{' '}
														{planHasAiNutritionEnabled ? 'Yes' : 'No'}
													</p>
												</div>
												<Switch
													disabled={isUpdating}
													checked={orgHasAiNutritionEnabled}
													onCheckedChange={(checked) => {
														void toggleTag(
															org.id,
															org.metaTags,
															AI_NUTRITION_ENABLED_TAG,
															checked === true,
														)
													}}
												/>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	)
}
