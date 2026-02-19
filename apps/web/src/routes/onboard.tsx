import { OnboardingForm } from '@/components/onboarding-form'
import { getUserForce } from '@/functions/get-user-force'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/onboard')({
	beforeLoad: async () => {
		const session = await getUserForce()
		return { session }
	},
	loader: async ({ context }) => {
		if (context.session.user?.organisationSlug) {
			const slug = context.session.user.organisationSlug
			redirect({
				to: '/$orgSlug',
				params: { orgSlug: slug },
				throw: true,
			})
		}
		if (!context.session) {
			redirect({ to: '/login', throw: true })
		}
	},
	component: OnboardComponent,
})

function OnboardComponent() {
	return <OnboardingForm />
}
