'use client'

import { ExerciseForm } from '@/components/admin/exercise/exercise-form'

export interface ExerciseCreateFormProps {
	onSuccess?: () => void
	organisationId: string
}

export function ExerciseCreateForm({
	onSuccess,
	organisationId,
}: ExerciseCreateFormProps) {
	return (
		<ExerciseForm
			mode='create'
			organisationId={organisationId}
			onSuccess={onSuccess}
		/>
	)
}
