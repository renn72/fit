import { OnboardingForm } from '@/components/onboarding-form'
import { authClient } from '@/lib/auth-client'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/onboard')({
	beforeLoad: async () => {
		const session = await authClient.getSession()
		if (!session.data) {
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
