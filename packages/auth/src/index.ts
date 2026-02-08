import { db } from '@fit/db'
import * as schema from '@fit/db/schema/auth'
import { env } from '@fit/env/server'

import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { sendEmail } from './send-email'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite',

		schema: schema,
	}),
	trustedOrigins: [env.CORS_ORIGIN, 'mybettertapp://', 'exp://'],
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			void sendEmail({
				to: user.email,
				url,
			})
		},
		autoSignInAfterVerification: true,
		sendOnSignUp: true,
	},
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 4,
		maxPasswordLength: 64,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: 'none',
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [expo()],
})
