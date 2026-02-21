# FIT API Testing Framework

This document describes the testing infrastructure for the FIT mono-repo's API package.

## Overview

We use **Vitest** with an **in-memory SQLite database** (via libsql) for fast, isolated testing. Tests run in parallel using Vitest's thread pool.

## Architecture

### In-Memory Database
- Created fresh per test file via `beforeAll`
- Reset between tests via `beforeEach`
- All migrations applied automatically
- Isolated from other test files

### Key Components

```
packages/api/tests/
├── helpers/
│   ├── auth.ts          # Session mocking utilities
│   ├── db.ts            # Database initialization & reset
├── fixtures/
│   ├── user.ts          # User test data factories
│   ├── org.ts           # Organisation factories
│   ├── exercise.ts      # Exercise factories
│   ├── movement.ts      # Movement factories
├── mocks/
│   └── db.ts            # Database mock overriding @fit/db
└── routers/
    └── *.test.ts        # Router test suites
```

## Running Tests

```bash
cd packages/api

# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage

# With UI
pnpm test:ui
```

## Writing Tests

### Basic Pattern

```typescript
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { call } from '@orpc/server'
import { routerName } from '../../src/routers/router-name'
import { createTestContext } from '../helpers/auth'
import { initTestDB, resetDatabase } from '../helpers/db'
import { fixtureFunction } from '../fixtures/fixture'
import { ORPCError } from '@orpc/server'

describe('Router Name', () => {
  beforeAll(async () => {
    await initTestDB()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  it('should do something', async () => {
    const user = await createUserFixture()
    
    const result = await call(routerName.procedure, {
      input: 'value'
    }, {
      context: createTestContext(user),
    })

    expect(result).toEqual(expected)
  })
})
```

### Available Fixtures

- `createRegularUser()` - No special permissions
- `createItemUpdater()` - Has `itemUpdater` metaTag
- `createDictator()` - Has `dictator` metaTag
- `createOrgFixture(creator)` - Creates organisation
- `createMovementFixture()` - Creates movement
- `createExerciseFixture()` - Creates exercise
- `createSuperSet(creator, orgId)` - Creates superset

### Permission Testing

```typescript
// Success case
const result = await call(procedure, input, {
  context: createTestContext(itemUpdater),
})

// Forbidden case
await expect(
  call(procedure, input, {
    context: createTestContext(regularUser),
  })
).rejects.toThrow(ORPCError)

// No session
await expect(
  call(procedure, input, {
    context: createTestContext(null),
  })
).rejects.toThrow(ORPCError)
```

## How It Works

1. **Vitest Config** (`vitest.config.ts`):
   - Regex aliases redirect `@fit/db` → test mock
   - Parallel execution with thread pool
   - Test environment variables

2. **Database Mock** (`tests/mocks/db.ts`):
   - Exports test database instance
   - All router imports use test DB

3. **Test Database** (`tests/helpers/db.ts`):
   - In-memory libsql database
   - Auto-migrates from `packages/db/src/migrations/`
   - Imports all schemas and relations
   - Provides `resetDatabase()` helper

4. **Auth Helpers** (`tests/helpers/auth.ts`):
   - Mock user creation
   - Test context building
   - Permission utilities

## Coverage

Reports generated in:
- Console (text)
- `coverage/` directory (HTML)
- `coverage/coverage-final.json`

## Troubleshooting

**"Test database not initialized"**:
```typescript
beforeAll(async () => {
  await initTestDB()
})
```

**"No such table" errors**:
- Check migrations ran in `tests/helpers/db.ts`
- Verify schema imports include all tables

**"Cannot find package"**:
- Check vitest.config.ts aliases use regex patterns
- Verify mock file exists at `tests/mocks/db.ts`

## Best Practices

1. Initialize DB once in `beforeAll`
2. Reset DB in `beforeEach`
3. Test both success and error paths
4. Test permission boundaries
5. Use fixtures - don't manually create data
6. Call procedures with `call()` from `@orpc/server`
