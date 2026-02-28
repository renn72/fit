'use client'

import { getRouteApi, useRouterState } from '@tanstack/react-router'

import _ from 'lodash'
import { UserMenuForm } from '../user-menu-form'

const createRoute = getRouteApi('/$orgSlug/user-menu-create')

export function UserMenuCreatePage() {
	// Get the current route path to determine mode
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const isEditRoute = pathname.includes('/user-menu-edit/')

	// Get context and params from appropriate route
	const context = createRoute.useRouteContext()
	const createParams = createRoute.useParams()
	const createSearch = createRoute.useSearch()

	// Use the appropriate values based on route
	const userOrgId = context.session?.user?.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>

	return (
		<UserMenuForm
			userOrgId={userOrgId}
			menuId={undefined}
			orgSlug={createParams.orgSlug}
			user={isEditRoute ? undefined : createSearch.user}
		/>
	)
}
