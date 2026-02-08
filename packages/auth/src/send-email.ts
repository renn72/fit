import { env } from '@fit/env/server'

import { Resend } from 'resend'

const resend = new Resend(env.RESEND_API_KEY)

export const sendEmail = async ({ to, url }: { to: string; url: string }) => {
	await resend.emails.send({
		from: 'fit@fit.co',
		to,
		subject: 'Verify your email address',
		html: `<h1>Click the link to verify your email</h1><p><a href="${url}">${url}</a></p>`,
	})
}
