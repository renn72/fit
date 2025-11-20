import Database from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

const client = new Database(process.env.DATABASE_URL || '')

export const db = drizzle({ client })

// import { drizzle } from 'drizzle-orm/libsql';
// import { createClient } from '@libsql/client';
//
// const client = createClient({ url: process.env.DATABASE_URL || 'file:./local.db', });
// export const db = drizzle(client);
