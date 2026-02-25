import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { orpc } from '@/utils/orpc'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import _ from 'lodash'
import { toast } from 'sonner'

interface MenuTemplate {
	id: string
	name: string
	description: string | null
	recipes: Array<{
		mealIndex: number
		recipeIndex: number
		recipe: {
			id: string
			name: string
			description: string | null
			category: string | null
			image: string | null
		} | null
	}>
}
const route = getRouteApi('/$orgSlug/user-menu-create')

export function UserMenuCreatePage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <UserMenuCreateForm userOrgId={userOrgId} />
}

function UserMenuCreateForm({ userOrgId }: { userOrgId: string }) {
	const navigate = useNavigate()
	const { user } = route.useSearch()
	const { orgSlug } = route.useParams()

	const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate | null>(
		null,
	)

	const [formData, setFormData] = useState({
		name: '',
		description: '',
		startDate: '',
		endDate: '',
	})

	const { data: menuTemplates } = useSuspenseQuery(
		orpc.menuTemplate.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)
	console.log(menuTemplates)

	const createMenuMutation = useMutation(
		orpc.userMenu.create.mutationOptions({
			onSuccess: () => {
				toast.success('Menu created successfully')
				navigate({
					to: '/$orgSlug/menu-templates',
					params: { orgSlug: orgSlug },
				})
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create menu')
			},
		}),
	)

	// Check if user is selected
	if (!user) {
		return (
			<div className='flex flex-col gap-4 p-8'>
				<Card>
					<CardHeader>
						<CardTitle>No User Selected</CardTitle>
						<CardDescription>
							Please select a user from the sidebar before creating a menu.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	const handleTemplateSelect = (template: MenuTemplate) => {
		setSelectedTemplate(template)
		setFormData((prev) => ({
			...prev,
			name: template?.name || '',
			description: template?.description || '',
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!selectedTemplate) {
			toast.error('Please select a menu template')
			return
		}

		// Create the user menu (meals and recipes will be added separately)
		await createMenuMutation.mutateAsync({
			userId: user,
			menuTemplateId: selectedTemplate.id,
			name: formData.name,
			description: formData.description || null,
			startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
			endDate: formData.endDate ? new Date(formData.endDate) : null,
		})
	}

	return (
		<div className='flex flex-col gap-6 p-8'>
			<h1 className='text-2xl font-bold'>Create User Menu</h1>

			{!selectedTemplate ? (
				<Card>
					<CardHeader>
						<CardTitle>Select Menu Template</CardTitle>
						<CardDescription>
							Choose a menu template to use as the base for this user's menu.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{menuTemplates?.map((template) => (
								<Card
									key={template.id}
									className='transition-colors cursor-pointer hover:bg-muted'
									onClick={() =>
										handleTemplateSelect(template as unknown as MenuTemplate)
									}
								>
									<CardHeader>
										<CardTitle className='text-lg'>{template.name}</CardTitle>
										<CardDescription>
											{template.recipes?.length || 0} recipes
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-muted-foreground line-clamp-2'>
											{template.description || 'No description'}
										</p>
									</CardContent>
								</Card>
							))}
							{!menuTemplates?.length && (
								<p className='col-span-full text-muted-foreground'>
									No menu templates available. Create one first.
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			) : (
				<>
					<Button
						variant='ghost'
						onClick={() => setSelectedTemplate(null)}
						className='w-fit'
					>
						← Back to templates
					</Button>

					<Card>
						<CardHeader>
							<CardTitle>Menu Details</CardTitle>
							<CardDescription>
								Configure the menu for the selected user
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className='flex flex-col gap-4'>
								<div className='grid gap-2'>
									<Label htmlFor='name'>Menu Name</Label>
									<Input
										id='name'
										value={formData.name}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
										required
									/>
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='description'>Description</Label>
									<Input
										id='description'
										value={formData.description}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
									/>
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='startDate'>Start Date</Label>
									<Input
										id='startDate'
										type='date'
										value={formData.startDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												startDate: e.target.value,
											}))
										}
									/>
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='endDate'>End Date</Label>
									<Input
										id='endDate'
										type='date'
										value={formData.endDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												endDate: e.target.value,
											}))
										}
									/>
								</div>

								<div className='p-4 mt-4 rounded-lg bg-muted'>
									<h3 className='mb-2 font-semibold'>Template Preview</h3>
									<p className='text-sm text-muted-foreground'>
										{selectedTemplate.recipes.length} recipes will be added to
										this menu
									</p>
								</div>

								<Button
									type='submit'
									className='mt-4'
									disabled={createMenuMutation.isPending}
								>
									{createMenuMutation.isPending ? 'Creating...' : 'Create Menu'}
								</Button>
							</form>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	)
}
