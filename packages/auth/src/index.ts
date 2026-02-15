import { db } from '@fit/db'
import * as schema from '@fit/db/schema/auth'
import { env } from '@fit/env/server'

import { sendEmail } from './send-email'

import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, customSession } from 'better-auth/plugins'

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
		// sendOnSignUp: true,
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
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 1 * 60,
			strategy: 'jwe',
		},
	},
	plugins: [
		expo(),
		admin(),
		customSession(async ({ user, session }) => {
			const dbUser = await db.query.user.findFirst({
				where: { id: user.id },
			})
			return {
				user: {
					...user,
					metaTags: dbUser?.metaTags, // a list of tags, delimited by comma
					organisationSlug: dbUser?.organisationSlug,
					organisationId: dbUser?.organisationId,
					organisationCreatorId: dbUser?.organisationCreatorId,
				},
				session,
			}
		}),
	],
})
