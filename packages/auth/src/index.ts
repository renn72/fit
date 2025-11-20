import { db } from '@fit/db'
import * as schema from '@fit/db/schema/auth'
import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from "better-auth/plugins"

const origin = process.env.CORS_ORIGIN?.split(',') || ['']

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: schema,
	}),
	trustedOrigins: origin,
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
  plugins: [admin()]
})
