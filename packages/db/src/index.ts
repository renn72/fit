import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/libsql'

const client = new Database(process.env.DATABASE_URL || '')

export const db = drizzle({ client })
