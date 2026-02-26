import { z } from 'zod'

export const MenuTemplateGetAllOrgInput = z.object({
	organisationId: z.string().min(1),
})

export const MenuTemplateGetInput = z.object({
	id: z.string().min(1),
})

export const MenuTemplateCreateInput = z.object({
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
})

export const MenuTemplateUpdateInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	category: z.string().optional().nullable(),
})

export const MenuTemplateDeleteInput = z.object({
	id: z.string().min(1),
})

// ***************** Meal Schemas *****************

export const MenuTemplateCreateMealInput = z.object({
	menuTemplateId: z.string().min(1),
	mealIndex: z.number().int(),
	name: z.string().min(1),
})

export const MenuTemplateUpdateMealInput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
})

export const MenuTemplateDeleteMealInput = z.object({
	id: z.string().min(1),
})

// ***************** Recipe Schemas *****************

export const MenuTemplateAddRecipeInput = z.object({
	menuTemplateId: z.string().min(1),
	recipeId: z.string().min(1),
	mealIndex: z.number().int(),
	recipeIndex: z.number().int(),
})

export const MenuTemplateRemoveRecipeInput = z.object({
	menuTemplateId: z.string().min(1),
	recipeId: z.string().min(1),
})
