#!/usr/bin/env bash
set -euo pipefail

TASK="$1"
BASE="${2:-origin/main}"

ROOT="$PWD"
WT_DIR="../$(basename "$ROOT")-wt/$TASK"
BRANCH="$TASK"

git fetch origin
git worktree add "$WT_DIR" -b "$BRANCH" "$BASE"

echo "Created:"
echo "  branch:   $BRANCH"
echo "  worktree: $WT_DIR"
