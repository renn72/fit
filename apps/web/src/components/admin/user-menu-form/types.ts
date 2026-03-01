export interface MealIngredient {
	id: string
	recipeToIngredientId: string
	ingredientId: string
	ingredientName: string
	serveSize: number
	serveUnit: string
	calories: number
	protein: number
	fat: number
	carbohydrate: number
}

export interface MealRecipe {
	id: string
	recipeId: string
	recipeName: string
	recipeIndex: number
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	ingredients: MealIngredient[]
}

export interface Meal {
	id: string
	mealIndex: number
	name: string
	targetCalories: number | null
	targetProtein: number | null
	recipes: MealRecipe[]
}

export interface MenuFormData {
	name: string
	description: string | null
	startDate: string | null
	endDate: string | null
	meals: Meal[]
}

export interface UserMenuFormProps {
	userOrgId: string
	menuId?: string
	orgSlug: string
	user?: string
	mode?: 'menu' | 'template'
}

export interface MacroTotals {
	calories: number
	protein: number
	fat: number
	carbohydrate: number
}
