import { useState } from 'react'

import SignInForm from '@/components/sign-in-form'
import SignUpForm from '@/components/sign-up-form'
import { getUserForce } from '@/functions/get-user-force'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUserForce()
		return { session }
	},
	loader: async ({ context }) => {
		if (context?.session?.user?.organisationSlug) {
			const slug = context.session.user.organisationSlug as string
			redirect({
				to: '/$orgSlug',
				params: { orgSlug: slug },
				throw: true,
			})
		}
	},
})

function RouteComponent() {
	const [showSignIn, setShowSignIn] = useState(false)

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	)
}
