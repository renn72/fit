// This module re-exports the test database
// It should be used to override @fit/db in tests
import { getTestDB, initTestDB } from '../helpers/db'

export { initTestDB, getTestDB }

// Initialize on first import
let initialized = false
export async function ensureTestDB() {
	if (!initialized) {
		await initTestDB()
		initialized = true
	}
	return getTestDB()
}

// Re-export for compatibility
export const db = await ensureTestDB()
