import { OnboardingForm } from '@/components/onboarding-form'
import { authClient } from '@/lib/auth-client'

import { createFileRoute, redirect } from '@tanstack/react-router'

import * as _ from 'lodash'

export const Route = createFileRoute('/onboard')({
	beforeLoad: async () => {
		const session = await authClient.getSession()
		console.log(session)
		if (!session.data || _.isString(session.data.user.organisationCreatorId)) {
			redirect({
				to: '/login',
				throw: true,
			})
		}
		return { session }
	},
	component: OnboardComponent,
})

function OnboardComponent() {
	return <OnboardingForm />
}
