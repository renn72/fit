import Database from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

console.log('database')
console.log(process.env.DATABASE_URL)

const client = new Database(process.env.DATABASE_URL || 'local.db')

export const db = drizzle({ client })
