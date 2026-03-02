'use client'

import { IngredientForm } from '@/components/admin/ingredient/ingredient-form'

export interface IngredientCreateFormProps {
	onSuccess?: () => void
}

export function IngredientCreateForm({ onSuccess }: IngredientCreateFormProps) {
	return <IngredientForm mode='create' onSuccess={onSuccess} />
}
