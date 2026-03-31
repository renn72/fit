# marketing

## Purpose

- Owns the standalone Astro marketing site for the FIT product.
- Explains positioning, features, and public entry points without depending on the authenticated app shell.

## Key Paths

- `apps/marketing/src/pages`
- `apps/marketing/src/components`
- `apps/marketing/src/layouts`
- `apps/marketing/src/styles`
- `apps/marketing/public`

## Current Shape

- Static site with hand-authored marketing pages like features, use-cases, about, and contact.
- Separate from product runtime concerns such as auth, oRPC, and org-scoped data.

## Style

- Make the value proposition legible fast; hero, sections, and CTAs should read cleanly on mobile first.
- Keep the visual direction distinct from back-office admin UI: more narrative, more whitespace, fewer dense controls.
- Preserve brand consistency without copying dashboard layouts into the public site.

## Change Rules

- Treat this app as a public brochure surface, not a place for app-only logic.
- Keep claims aligned with the actual feature set in the product apps and `SESSION_LOG_fit.md`.
- Prefer updating reusable page sections/components instead of duplicating one-off marketing blocks.

