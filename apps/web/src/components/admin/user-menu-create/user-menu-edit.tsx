'use client'

import { getRouteApi } from '@tanstack/react-router'

import _ from 'lodash'
import { UserMenuForm } from '../user-menu-form'

const editRoute = getRouteApi('/$orgSlug/user-menu-edit/$menuId')

export function UserMenuEditPage() {
	// Get the current route path to determine mode

	// Get context and params from appropriate route
	const context = editRoute?.useRouteContext()
	const params = editRoute?.useParams()

	// Use the appropriate values based on route
	const userOrgId = context.session?.user?.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>

	return (
		<UserMenuForm
			userOrgId={userOrgId}
			menuId={params.menuId}
			orgSlug={params.orgSlug}
			user={undefined}
		/>
	)
}
