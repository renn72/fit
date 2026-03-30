export type AuthSession =
	| {
			user?: {
				metaTags?: string | null
				organisationId?: string | null
				organisationSlug?: string | null
			} | null
	  }
	| null
	| undefined

export type AuthRedirectTarget =
	| {
			to: '/'
	  }
	| {
			to: '/login'
	  }
	| {
			to: '/onboard'
	  }
	| {
			to: '/dictator'
	  }
	| {
			to: '/$orgSlug'
			params: { orgSlug: string }
	  }

function getMetaTags(session: AuthSession) {
	return session?.user?.metaTags?.split(',') ?? []
}

export function isDictator(session: AuthSession) {
	return getMetaTags(session).includes('dictator')
}

export function getOrganisationRedirectTarget(
	session: AuthSession,
): Extract<AuthRedirectTarget, { to: '/$orgSlug' }> | null {
	const organisationSlug = session?.user?.organisationSlug
	if (!organisationSlug) {
		return null
	}

	return {
		to: '/$orgSlug',
		params: { orgSlug: organisationSlug },
	}
}

export function getAuthPageRedirectTarget(
	session: AuthSession,
): Exclude<AuthRedirectTarget, { to: '/login' | '/' }> | null {
	const organisationRedirect = getOrganisationRedirectTarget(session)
	if (organisationRedirect) {
		return organisationRedirect
	}

	if (!session?.user) {
		return null
	}

	if (isDictator(session)) {
		return { to: '/dictator' }
	}

	return { to: '/onboard' }
}

export function getOnboardRedirectTarget(
	session: AuthSession,
): Exclude<AuthRedirectTarget, { to: '/' | '/dictator' }> | null {
	if (!session?.user) {
		return { to: '/login' }
	}

	return getOrganisationRedirectTarget(session)
}

export function getAdminRedirectTarget(
	session: AuthSession,
): Exclude<AuthRedirectTarget, { to: '/' }> {
	if (!session?.user) {
		return { to: '/login' }
	}

	return getAuthPageRedirectTarget(session) ?? { to: '/onboard' }
}
