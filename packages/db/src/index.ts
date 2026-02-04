import { env } from '@fit/env/server'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { relations } from './relations'
import * as schema from './schema'

const client = createClient({
	url: env.DATABASE_URL,
})

export const db = drizzle({ client, schema, relations })
