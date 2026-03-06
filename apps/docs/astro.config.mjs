import starlight from '@astrojs/starlight'
// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Forma Docs',
			disable404Route: true,
			sidebar: [
				{
					label: 'User Menu System',
					items: [
						{
							label: 'Workflow Overview',
							slug: 'guides/user-menu-system/workflow-overview',
						},
						{
							label: 'Create Ingredients',
							slug: 'guides/user-menu-system/create-ingredients',
						},
						{
							label: 'Create Recipes',
							slug: 'guides/user-menu-system/create-recipes',
						},
						{
							label: 'Create Menu Templates',
							slug: 'guides/user-menu-system/create-menu-templates',
						},
						{
							label: 'Assign Menu Template to User',
							slug: 'guides/user-menu-system/assign-menu-template-to-user',
						},
					],
				},
			],
		}),
	],
})
