import { env } from '@fit/env/server'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

const client = createClient({
	url: env.DATABASE_SERVER_LOG_URL,
})

export const dbServerLog = drizzle({ client, schema })
