'use client'

import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LoadingButton } from '@/components/ui-extended/loading-button'
import { orpc } from '@/utils/orpc'

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'

import { toast } from 'sonner'

type AppFeaturesState = {
	aiEnabled: boolean
	aiNutritionEnabled: boolean
}

export function AppFeaturesPage() {
	const queryClient = useQueryClient()
	const { data } = useSuspenseQuery(orpc.feature.getAppFeatures.queryOptions())

	const [draft, setDraft] = React.useState<AppFeaturesState>({
		aiEnabled: data.aiEnabled,
		aiNutritionEnabled: data.aiNutritionEnabled,
	})

	React.useEffect(() => {
		setDraft({
			aiEnabled: data.aiEnabled,
			aiNutritionEnabled: data.aiNutritionEnabled,
		})
	}, [data.aiEnabled, data.aiNutritionEnabled])

	const updateAppFeatures = useMutation(
		orpc.feature.updateAppFeatures.mutationOptions({
			onSuccess: () => {
				toast.success('App features updated')
				queryClient.invalidateQueries({
					queryKey: orpc.feature.getAppFeatures.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.feature.getAiAccess.key(),
				})
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update app features')
			},
		}),
	)

	const onSave = async () => {
		await updateAppFeatures.mutateAsync(draft)
	}

	return (
		<div className='mx-auto w-full max-w-3xl space-y-4'>
			<div>
				<h1 className='text-2xl font-bold'>App Features</h1>
				<p className='text-sm text-muted-foreground'>
					Global feature switches. These must be enabled before
					organisation/plan metatags can grant AI access.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>AI Controls</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='flex items-center justify-between rounded-lg border p-4'>
						<div className='space-y-1'>
							<Label>AI Enabled</Label>
							<p className='text-sm text-muted-foreground'>
								Master switch for AI features.
							</p>
						</div>
						<Switch
							checked={draft.aiEnabled}
							onCheckedChange={(checked) =>
								setDraft((prev) => ({ ...prev, aiEnabled: checked === true }))
							}
						/>
					</div>

					<div className='flex items-center justify-between rounded-lg border p-4'>
						<div className='space-y-1'>
							<Label>AI Nutrition Enabled</Label>
							<p className='text-sm text-muted-foreground'>
								Enables nutrition-related AI updates in recipe and menu forms.
							</p>
						</div>
						<Switch
							checked={draft.aiNutritionEnabled}
							onCheckedChange={(checked) =>
								setDraft((prev) => ({
									...prev,
									aiNutritionEnabled: checked === true,
								}))
							}
						/>
					</div>

					<div className='flex justify-end'>
						<LoadingButton
							onClick={onSave}
							loading={updateAppFeatures.isPending}
							className='min-w-28'
						>
							Save
						</LoadingButton>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
