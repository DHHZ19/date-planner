#!/usr/bin/env bash
# Post-coding hook: runs automatically after agents finish coding
# Usage: ./.opencode/post-agent-hook.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running post-coding fixes (Prettier + Tailwind class sort + ESLint --fix)..."

# npm run check runs: prettier --write . && eslint --fix
npm run check

echo "Post-coding fixes complete."
