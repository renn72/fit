import { useState } from 'react'

import SignInForm from '@/components/sign-in-form'
import SignUpForm from '@/components/sign-up-form'
import { getUser } from '@/functions/get-user'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser()
		return { session }
	},
	loader: async ({ context }) => {
		if (context.session && context.session.user.organisationSlug) {
			const slug = context.session.user.organisationSlug as string
			redirect({
				// TODO
				// @ts-ignore
				to: `/admin/${slug}/s`,
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
