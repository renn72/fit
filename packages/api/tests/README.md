# API Testing Guide

This directory contains the test infrastructure for the FIT API package.

## Architecture

### In-Memory Database
Tests use an in-memory SQLite database (via libsql) that is:
- Created fresh for each test file (via `beforeAll`)
- Reset between tests (via `beforeEach`)
- Migrated with all schema changes automatically
- Isolated from other test files (parallel execution)

### Key Files

```
tests/
├── helpers/
│   ├── auth.ts          # Session mocking utilities
│   ├── db.ts            # Database initialization & reset
│   └── ...
├── fixtures/
│   ├── user.ts          # User test data factories
│   ├── org.ts           # Organisation factories
│   ├── exercise.ts      # Exercise factories
│   ├── movement.ts      # Movement factories
│   └── ...
├── mocks/
│   └── db.ts            # Database mock that overrides @fit/db
└── routers/
    └── exercise.test.ts # Example test suite
```

### Test Pattern

```typescript
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { call } from '@orpc/server'
import { exerciseRouter } from '../../src/routers/exercise'
import { createTestContext } from '../helpers/auth'
import { initTestDB, resetDatabase } from '../helpers/db'
import { createDictator, createItemUpdater } from '../fixtures/user'
import { createOrgFixture } from '../fixtures/org'
import { createMovementFixture } from '../fixtures/movement'
import { createExerciseFixture } from '../fixtures/exercise'
import { ORPCError } from '@orpc/server'

describe('Exercise Router', () => {
  beforeAll(async () => {
    await initTestDB()  // Initialize test database once per file
  })

  beforeEach(async () => {
    await resetDatabase()  // Clean state between tests
  })

  it('should create exercise for itemUpdater', async () => {
    const itemUpdater = await createItemUpdater()
    const org = await createOrgFixture(itemUpdater)
    const movement = await createMovementFixture()

    itemUpdater.organisationId = org.id

    const result = await call(exerciseRouter.create, {
      name: 'New Exercise',
      movementId: movement.id,
      sets: 3,
      reps: 10,
      repUnit: 'reps',
    }, {
      context: createTestContext(itemUpdater),
    })

    expect(result.name).toBe('New Exercise')
    expect(result.creatorId).toBe(itemUpdater.id)
  })
})
```

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## Writing Tests for New Routers

1. **Create test file** in `tests/routers/[router-name].test.ts`
2. **Import fixtures** you need from `tests/fixtures/`
3. **Use `call()`** from `@orpc/server` to invoke procedures
4. **Test both success and error cases**
5. **Test permission boundaries** (dictator, itemUpdater, regular user)

### Available Fixtures

- `createRegularUser()` - User with no special permissions
- `createItemUpdater()` - User with itemUpdater metaTag
- `createDictator()` - User with dictator metaTag
- `createOrgFixture(creator)` - Creates an organisation
- `createMovementFixture()` - Creates a movement
- `createExerciseFixture()` - Creates an exercise
- `createSuperSet(creator, orgId)` - Creates a superset exercise

### Auth Testing Pattern

```typescript
// Should succeed for authorized users
const result = await call(procedure, input, {
  context: createTestContext(itemUpdater),
})

// Should fail for unauthorized users
await expect(
  call(procedure, input, {
    context: createTestContext(regularUser),
  })
).rejects.toThrow(ORPCError)

// Should fail without session
await expect(
  call(procedure, input, {
    context: createTestContext(null),
  })
).rejects.toThrow(ORPCError)
```

## How It Works

1. **Vitest Config** (`vitest.config.ts`):
   - Uses regex aliases to redirect `@fit/db` imports to the test mock
   - Runs tests in parallel with thread pool
   - Sets up test environment variables

2. **Database Mock** (`tests/mocks/db.ts`):
   - Overrides `@fit/db` package export
   - Exports the test database instance
   - Ensures all router imports use the test DB

3. **Test Database** (`tests/helpers/db.ts`):
   - Creates in-memory libsql database
   - Runs all migrations from `packages/db/src/migrations/`
   - Imports all schema modules and relations
   - Provides `resetDatabase()` to clear data between tests

4. **Auth Helpers** (`tests/helpers/auth.ts`):
   - Creates mock user objects
   - Builds test contexts for oRPC calls
   - Provides permission check utilities

## Coverage

Coverage reports are generated in:
- Console output (text)
- `coverage/` directory (HTML)
- `coverage/coverage-final.json` (JSON)

## Best Practices

1. **Always reset database** in `beforeEach`
2. **Initialize once** in `beforeAll`, not in every test
3. **Test error cases** - not just happy paths
4. **Test permissions** - verify FORBIDDEN errors
5. **Use fixtures** - don't manually create data
6. **Clean up** - remove temporary files after tests

## Adding New Fixtures

When adding new entities:

1. Create fixture file in `tests/fixtures/`
2. Import schema from `../../../db/src/schema/[entity]`
3. Import `getTestDB` from `../helpers/db`
4. Export factory functions that create test data
5. Return plain objects (not Drizzle results) for type safety

## Troubleshooting

**"Test database not initialized"**:
- Add `await initTestDB()` in `beforeAll`

**"No such table" errors**:
- Ensure migrations ran (check `tests/helpers/db.ts`)
- Verify schema imports include all tables

**"Cannot find package" errors**:
- Check vitest.config.ts aliases
- Ensure paths are correct relative to test file

**Permission errors not throwing ORPCError**:
- The router might be throwing before reaching permission check
- Check that mock users have correct metaTags
