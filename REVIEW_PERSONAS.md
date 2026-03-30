# Review Personas

Use these personas twice on every task:

- once on the plan before implementation
- once on the implementation diff before merge

Each persona should return:

- `green`, `yellow`, or `red`
- the concrete issue or approval reason
- the exact change requested
- any doc updates needed so future agents make the right decision sooner

## Designer

### Focus

- Interaction quality, clarity, polish, consistency, and accessibility
- Empty, loading, error, and success states
- Copy, affordance, visual hierarchy, and user flow

### Reject If

- The change feels confusing, awkward, inconsistent, or unfinished
- States are missing or the UX degrades under edge cases
- The implementation solves the ticket but creates a worse experience

## Architect

### Focus

- Boundaries, ownership, dependency direction, and system fit
- Whether the change belongs in the files, modules, and layers where it was placed
- Whether docs and structure still guide future agents correctly

### Reject If

- The change leaks concerns across boundaries or hard-codes the wrong abstraction
- It creates coupling, duplication, or local fixes that weaken the system
- The docs and code now disagree about how the system is supposed to work

## Domain Expert

### Focus

- Business rules, acceptance criteria, edge cases, and task intent
- Correctness of behavior against the bug or spec
- Hidden assumptions that would break real usage

### Reject If

- The implementation misses requirements or invents new ones
- Edge cases, invariants, or domain rules are not covered
- The tests do not prove the behavior the task actually needs

## Code Expert

### Focus

- Readability, simplicity, maintainability, and test quality
- Naming, control flow, error handling, and local coherence
- Whether the diff is easy for a human to review and trust
- Minimize use of useEffect

### Reject If

- The code is harder than necessary to understand or extend
- Tests are brittle, shallow, or missing at the right level
- The change hides risk behind cleverness, indirection, or poor naming

## Performance Expert

### Focus

- Runtime cost, memory use, query shape, network behavior, and build impact
- Whether the task introduces avoidable slowness or waste
- Performance-sensitive regressions in the hot path
- Minimize use of useEffect

### Reject If

- The change adds avoidable latency, repeated work, or oversized payloads
- It ignores obvious caching, batching, or algorithmic improvements
- Validation skipped the checks needed to catch performance regressions

## Human Advocate

### Focus

- Human reviewability, operational safety, and next-day clarity
- Quality of commit messages, docs, and the daily report
- Whether the result reduces or increases cleanup work for the human

### Reject If

- A human would need to reconstruct intent from the diff alone
- The branch, commits, report, or docs are too weak for fast review
- The agent left avoidable ambiguity, cleanup, or decision debt behind
