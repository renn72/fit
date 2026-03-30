'use client'

import * as React from 'react'

import { Badge } from '@fit/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@fit/components/ui/card'
import { Label } from '@fit/components/ui/label'
import { Switch } from '@fit/components/ui/switch'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
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
	const orgOptions = React.useMemo(
		() =>
			organisations
				.map((org) => ({
					value: org.id,
					label: `${org.name} (${org.slug})`,
				}))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[organisations],
	)

	const [selectedOrgId, setSelectedOrgId] = React.useState<string>(
		() => organisations[0]?.id ?? '',
	)
	const [updatingOrgId, setUpdatingOrgId] = React.useState<string | null>(null)

	React.useEffect(() => {
		if (organisations.some((org) => org.id === selectedOrgId)) {
			return
		}

		setSelectedOrgId(organisations[0]?.id ?? '')
	}, [organisations, selectedOrgId])

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

	const selectedOrg = React.useMemo(
		() => organisations.find((org) => org.id === selectedOrgId) ?? null,
		[organisations, selectedOrgId],
	)

	const orgHasAiEnabled = hasTag(selectedOrg?.metaTags, AI_ENABLED_TAG)
	const orgHasAiNutritionEnabled = hasTag(
		selectedOrg?.metaTags,
		AI_NUTRITION_ENABLED_TAG,
	)
	const planHasAiEnabled = hasTag(selectedOrg?.planMetaTags, AI_ENABLED_TAG)
	const planHasAiNutritionEnabled = hasTag(
		selectedOrg?.planMetaTags,
		AI_NUTRITION_ENABLED_TAG,
	)
	const isUpdating = selectedOrg !== null && updatingOrgId === selectedOrg.id

	return (
		<div className='mx-auto w-full max-w-6xl space-y-4'>
			<div>
				<h1 className='text-2xl font-bold'>Organisation Feature Meta Tags</h1>
				<p className='text-sm text-muted-foreground'>
					Select an organisation, then grant AI access by setting meta tags.
					Plan meta tags are read-only here and also contribute to effective
					access.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Select Organisation</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='max-w-2xl space-y-2'>
						<Label>Organisation ({organisations.length})</Label>
						<VirtualizedCombobox
							options={orgOptions}
							selectedOption={selectedOrgId}
							onSelectOption={(value) =>
								setSelectedOrgId(value || selectedOrgId)
							}
							searchPlaceholder='Search organisations by name or slug...'
							width='100%'
							height='320px'
						/>
					</div>
				</CardContent>
			</Card>

			{selectedOrg ? (
				<Card>
					<CardHeader>
						<CardTitle>{selectedOrg.name}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='text-xs text-muted-foreground'>
							{selectedOrg.slug} • Plan: {selectedOrg.planName}
						</div>

						<div className='flex flex-wrap gap-2'>
							<Badge variant='outline'>
								Org tags: {selectedOrg.metaTags || 'none'}
							</Badge>
							<Badge variant='secondary'>
								Plan tags: {selectedOrg.planMetaTags || 'none'}
							</Badge>
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
											selectedOrg.id,
											selectedOrg.metaTags,
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
										Plan grants: {planHasAiNutritionEnabled ? 'Yes' : 'No'}
									</p>
								</div>
								<Switch
									disabled={isUpdating}
									checked={orgHasAiNutritionEnabled}
									onCheckedChange={(checked) => {
										void toggleTag(
											selectedOrg.id,
											selectedOrg.metaTags,
											AI_NUTRITION_ENABLED_TAG,
											checked === true,
										)
									}}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className='pt-6 text-sm text-muted-foreground'>
						No organisations available.
					</CardContent>
				</Card>
			)}
		</div>
	)
}
