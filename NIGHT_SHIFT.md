# Night Shift

Load this file at the start of a night run and follow it literally. The goal is autonomous, high-discipline execution with minimal human cleanup the next day.

## Non-Negotiables

- Treat the current branch as the working branch unless explicitly told otherwise. This is usually `main`.
- Work bugs before specs.
- Only pick tasks from `./bugs` and `./spec`.
- Ignore any file whose basename starts with `draft-`.
- Process exactly one non-draft task file per loop iteration.
- Never batch multiple bug or spec files into one branch, one implementation pass, one report entry, or one merge.
- Create a fresh task branch for every selected bug or spec.
- Make regular, detailed commits during the task. Do not squash them away.
- Merge the finished task branch back into the working branch with preserved history. Prefer fast-forward merge.
- Record task start and finish times in `./report` using **AEST** timestamps (`UTC+10`), not vague relative times.
- If requirements are missing or conflicting, do not invent scope. Log the issue, preserve the work, and move on or stop.

## Inputs

- `./bugs`: bug write-ups and fixes to prioritize first
- `./spec`: feature specs to implement after bugs are clear
- `REVIEW_PERSONAS.md`: the six critical reviewers
- `AGENTS.md`: routing doc for deeper project guidance
- Repo docs and code: the source of truth for implementation details
- apply the `AGENTS_LOOP.md` to each bug or task
- if numbered, complete bugs 1_*, 2_*, 3_* and then specs 1_*, 2_*, 3_* ect
- once bug/spec has been finished, move the big/spec md to the the `./finished_bug/` or `./finished_spec/` dir

## Task Granularity

- One task file equals one loop iteration.
- If the human asks for "all specs" or "all bugs", still process them one file at a time through separate loop iterations.
- Do not continue to the next task file until the current task file is merged, blocked, skipped, or abandoned in the report.

## Daily Report

- Ensure `./report` exists before starting task work.
- Use one report file per AEST day: `./report/{project-name}-YYYY-MM-DD.md`.
- Add one section per task with:
  - task type: `bug` or `spec`
  - task file
  - branch name
  - start time in AEST
  - finish time in AEST
  - status: merged, blocked, skipped, or abandoned
  - short note on validations run
  - short note on blockers or follow-ups


## Commit Standard

Use detailed commit messages meant for human review the next morning.

The first commit on every task branch must be a test-first commit and must start with:

```text
test: <specific summary>
```

Preferred shape:

```text
<type>: <specific summary>

Context:
- why this task exists

Changes:
- the main code and doc changes

Validation:
- exact checks run
```

## Stop Conditions

Stop and make a clear note in the report if:

- the task spec or bug report is too incomplete to implement safely
- the working tree cannot be protected safely
- a task branch was not created before coding started
- the report entry for the current branch does not exist before implementation starts
- the first commit is not a `test:` commit
- baseline validations are already broken and cannot be repaired in reasonable time

If hiting a stop conditions.

1. Create a bug report in `./bugs/`
2. Start a new AGENTS_LOOP to correct the bug
3. If the bug has been repaired continue with the loop
4. If the bug fails to be repaired. Stop the loop, Stop the Night Shift, and write a report
