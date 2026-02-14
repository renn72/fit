import { env } from '@fit/env/server'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { relations } from './relations'
import * as auth from './schema/auth'
import * as exercise from './schema/exercise'
import * as org from './schema/org'
import * as ingredient from './schema/ingredient'

const schema = { ...org, ...auth, ...exercise, ...ingredient }

const client = createClient({
	url: env.DATABASE_URL,
})

export const db = drizzle({ client, schema, relations })
