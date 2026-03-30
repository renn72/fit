import { useState } from 'react'

import SignInForm from '@/components/sign-in-form'
import SignUpForm from '@/components/sign-up-form'
import { getUserForce } from '@/functions/get-user-force'
import { getAuthPageRedirectTarget } from '@/lib/auth-routing'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/signin')({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUserForce()
		return { session }
	},
	loader: async ({ context }) => {
		const redirectTarget = getAuthPageRedirectTarget(context.session)
		if (redirectTarget) {
			throw redirect(redirectTarget)
		}
	},
})

function RouteComponent() {
	const [showSignIn, setShowSignIn] = useState(true)

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	)
}
