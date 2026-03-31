import 'dotenv/config'

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
	server: {
		RESEND_API_KEY: z.string().min(1),
		ZEN_API_KEY: z.string().min(1),
		ZEN_MODEL: z.string().min(1).optional(),
		DATABASE_URL: z.string().min(1),
		DATABASE_SERVER_LOG_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.string(),
		NODE_ENV: z
			.enum(['development', 'production', 'test'])
			.default('development'),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
})
