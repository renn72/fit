'use client'

import {
	ExerciseForm,
	type ExerciseFormExercise,
} from '@/components/admin/exercise/exercise-form'

export interface ExerciseEditFormProps {
	organisationId: string
	exercise: ExerciseFormExercise
	onSuccess?: () => void
}

export function ExerciseEditForm({
	organisationId,
	exercise,
	onSuccess,
}: ExerciseEditFormProps) {
	return (
		<ExerciseForm
			mode='edit'
			organisationId={organisationId}
			exercise={exercise}
			onSuccess={onSuccess}
		/>
	)
}
