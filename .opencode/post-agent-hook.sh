#!/bin/bash
# Post-coding hook: runs automatically after agents finish coding
# Usage: ./.opencode/post-agent-hook.sh

set -e

echo "🔍 Running post-coding lint check..."

# Run prettier + eslint --fix (same as npm run check)
npm run check

echo "✅ Lint check complete!"
