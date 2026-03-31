# docs

## Purpose

- Houses the Astro + Starlight documentation site.
- Publishes user-facing reference material, currently centered on menu workflows and linked support content.

## Key Paths

- `apps/docs/src/content`
- `apps/docs/src/pages`
- `apps/docs/src/assets`
- `apps/docs/public`

## Current Shape

- Separate static surface, not part of the authenticated runtime.
- Best treated as the long-form explanation layer behind product flows that need deep guidance.

## Style

- Optimize for instructional clarity over brand flourish.
- Prefer short sections, explicit headings, screenshots/examples when needed, and strong information scent from the page title alone.
- Keep support content consistent with the product vocabulary used in `apps/web`.

## Change Rules

- When product copy, flows, or deep links change, verify whether docs content or links need the same update.
- Keep docs content factual and task-oriented; avoid speculative roadmap notes.
- Prefer content changes in `src/content` before custom page logic.

