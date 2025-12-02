# Project Architecture

## Monorepo

### Server

- @/apps/server

Main server files

#### Server Core Files

- @/apps/server/src/index.ts
- @/apps/server/package.json

### Web Admin Portal

- @/apps/web-admin

#### Admin Core Files

- @/apps/web-admin/src/main.tsx
- @/apps/web-admin/package.json

### Web Exercise Plan Portal

- @/apps/web-exercise-plan

#### Exercise Core Files

- @/apps/web-exercise-plan/src/main.tsx
- @/apps/web-exercise-plan/package.json

### Web Diet Plan Portal

- @/apps/web-diet-plan

#### Diet Core Files

- @/apps/web-diet-plan/src/main.tsx
- @/apps/web-diet-plan/package.json

### Database

- @/apps/server/db/local.db
- @/packages/db/

#### Schema Files

- @/packages/db/src/schema/

#### Database Notes

- currently sqlite, thinking about postgres upgrade, manages with drizzle
