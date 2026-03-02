'use client'

import { RecipeForm } from '@/components/admin/recipe/recipe-form'

export interface RecipeEditFormProps {
	organisationId: string
	recipeId: string
	onSuccess?: () => void
}

export function RecipeEditForm({
	organisationId,
	recipeId,
	onSuccess,
}: RecipeEditFormProps) {
	return (
		<RecipeForm
			mode='edit'
			organisationId={organisationId}
			recipeId={recipeId}
			onSuccess={onSuccess}
		/>
	)
}
