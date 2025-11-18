import Database from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

const client = new Database(process.env.DATABASE_URL || '')

export const db = drizzle({ client })
