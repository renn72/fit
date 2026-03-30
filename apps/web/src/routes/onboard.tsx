import { OnboardingForm } from '@/components/onboarding-form'
import { getUserForce } from '@/functions/get-user-force'
import { getOnboardRedirectTarget } from '@/lib/auth-routing'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/onboard')({
	beforeLoad: async () => {
		const session = await getUserForce()
		return { session }
	},
	loader: async ({ context }) => {
		const redirectTarget = getOnboardRedirectTarget(context.session)
		if (redirectTarget) {
			throw redirect(redirectTarget)
		}
	},
	component: OnboardComponent,
})

function OnboardComponent() {
	return <OnboardingForm />
}
