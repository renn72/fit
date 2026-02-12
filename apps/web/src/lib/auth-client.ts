import type { auth } from '@fit/auth'
import { env } from '@fit/env/web'

import { adminClient, customSessionClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	plugins: [adminClient(), customSessionClient<typeof auth>()],
})
