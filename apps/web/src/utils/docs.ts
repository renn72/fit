import { env } from '@fit/env/web'

export const docsPaths = {
	createIngredients: '/guides/user-menu-system/create-ingredients/',
	createRecipes: '/guides/user-menu-system/create-recipes/',
	createMenuTemplates: '/guides/user-menu-system/create-menu-templates/',
	assignMenuTemplateToUser:
		'/guides/user-menu-system/assign-menu-template-to-user/',
} as const

export type DocsPathKey = keyof typeof docsPaths

export function getDocsUrl(key: DocsPathKey): string {
	const base = env.VITE_DOCS_SITE.replace(/\/$/, '')
	return `${base}${docsPaths[key]}`
}
