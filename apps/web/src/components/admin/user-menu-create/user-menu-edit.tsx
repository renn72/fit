'use client'

import { getRouteApi, useRouterState } from '@tanstack/react-router'

import { UserMenuForm } from './user-menu-form'

import _ from 'lodash'

const editRoute = getRouteApi('/$orgSlug/user-menu-edit/$menuId')

export function UserMenuEditPage() {
	// Get the current route path to determine mode
	const pathname = useRouterState({ select: (s) => s.location.pathname })

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
