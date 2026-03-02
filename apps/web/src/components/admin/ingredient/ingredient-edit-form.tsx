'use client'

import {
	IngredientForm,
	type IngredientFormIngredient,
} from '@/components/admin/ingredient/ingredient-form'

interface Ingredient {
	id: string
	name: string
	category: string | null
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
	serveUnit: string
}

export interface IngredientEditFormProps {
	ingredient: Ingredient
	onSuccess?: () => void
}

export function IngredientEditForm({
	ingredient,
	onSuccess,
}: IngredientEditFormProps) {
	const normalizedIngredient: IngredientFormIngredient = {
		...ingredient,
		category: ingredient.category ?? null,
	}

	return (
		<IngredientForm
			mode='edit'
			ingredient={normalizedIngredient}
			onSuccess={onSuccess}
		/>
	)
}
