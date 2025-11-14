import { db } from '@fit/db'
import * as schema from '@fit/db/schema/auth'
import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: schema,
	}),
	trustedOrigins: [process.env.CORS_ORIGIN || ''],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: 'none',
			secure: true,
			httpOnly: true,
		},
	},
})
