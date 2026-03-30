import {
	getAdminRedirectTarget,
	getAuthPageRedirectTarget,
	getOnboardRedirectTarget,
	getOrganisationRedirectTarget,
} from '@/lib/auth-routing'

const noOrgSession = {
	user: {
		metaTags: '',
		organisationId: null,
		organisationSlug: null,
	},
}

describe('getOrganisationRedirectTarget', () => {
	it('returns the organisation route when a slug is present', () => {
		expect(
			getOrganisationRedirectTarget({
				user: {
					organisationSlug: 'alpha',
				},
			}),
		).toEqual({
			to: '/$orgSlug',
			params: { orgSlug: 'alpha' },
		})
	})

	it('returns null when no organisation slug exists', () => {
		expect(getOrganisationRedirectTarget(noOrgSession)).toBeNull()
	})
})

describe('getAuthPageRedirectTarget', () => {
	it('allows unauthenticated users onto auth pages', () => {
		expect(getAuthPageRedirectTarget(null)).toBeNull()
	})

	it('sends authenticated users without an organisation to onboarding', () => {
		expect(getAuthPageRedirectTarget(noOrgSession)).toEqual({
			to: '/onboard',
		})
	})

	it('sends dictator users without an organisation to dictator mode', () => {
		expect(
			getAuthPageRedirectTarget({
				user: {
					metaTags: 'dictator',
					organisationId: null,
					organisationSlug: null,
				},
			}),
		).toEqual({
			to: '/dictator',
		})
	})

	it('sends users with an organisation to their org shell', () => {
		expect(
			getAuthPageRedirectTarget({
				user: {
					metaTags: '',
					organisationId: 'org_1',
					organisationSlug: 'alpha',
				},
			}),
		).toEqual({
			to: '/$orgSlug',
			params: { orgSlug: 'alpha' },
		})
	})
})

describe('getOnboardRedirectTarget', () => {
	it('requires login before onboarding', () => {
		expect(getOnboardRedirectTarget(null)).toEqual({
			to: '/login',
		})
	})

	it('keeps authenticated users without an organisation on onboarding', () => {
		expect(getOnboardRedirectTarget(noOrgSession)).toBeNull()
	})

	it('redirects authenticated org users away from onboarding', () => {
		expect(
			getOnboardRedirectTarget({
				user: {
					organisationId: 'org_1',
					organisationSlug: 'alpha',
				},
			}),
		).toEqual({
			to: '/$orgSlug',
			params: { orgSlug: 'alpha' },
		})
	})
})

describe('getAdminRedirectTarget', () => {
	it('sends unauthenticated users to login', () => {
		expect(getAdminRedirectTarget(null)).toEqual({
			to: '/login',
		})
	})

	it('sends authenticated users without an organisation to onboarding', () => {
		expect(getAdminRedirectTarget(noOrgSession)).toEqual({
			to: '/onboard',
		})
	})

	it('sends dictator users without an organisation to dictator mode', () => {
		expect(
			getAdminRedirectTarget({
				user: {
					metaTags: 'dictator',
					organisationId: null,
					organisationSlug: null,
				},
			}),
		).toEqual({
			to: '/dictator',
		})
	})

	it('sends org users to their organisation shell', () => {
		expect(
			getAdminRedirectTarget({
				user: {
					metaTags: '',
					organisationId: 'org_1',
					organisationSlug: 'alpha',
				},
			}),
		).toEqual({
			to: '/$orgSlug',
			params: { orgSlug: 'alpha' },
		})
	})
})
