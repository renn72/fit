# FIT Repo Instructions

At the start of every new Codex session in this repository, read these files into working context before making changes, unless the user explicitly says not to:

- `API.md`
- `WEBROUTES.md`
- `ARCHITECTURE.md`

Treat them as the primary startup context for this repo:

- `API.md` is the current API/router contract summary.
- `WEBROUTES.md` is the current web route map.
- `ARCHITECTURE.md` is the monorepo structure summary.

Documentation upkeep rules:

- If API contracts or routers change, update `API.md` in the same work session.
- If web routes change, update `WEBROUTES.md` in the same work session.
- If the repo structure or package boundaries materially change, update `ARCHITECTURE.md` in the same work session.
- After finishing an update git add and commit with a relevant message
