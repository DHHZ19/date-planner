#!/usr/bin/env bash
# Tailwind CSS syntax validation script
# Detects and reports Tailwind v4 syntax issues

set -euo pipefail

echo "🎨 Validating Tailwind CSS syntax..."

# Check for var() syntax that should use CSS custom property shorthand
# Pattern: focus:ring-[var(--custom-prop)] should be focus:ring-(--custom-prop)
PATTERN='(focus|ring|text|bg|border|shadow|placeholder):[^"'\'']*\[var\(--[^)]+\)\]'
MATCHES=$(grep -r "$PATTERN" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "⚠️  Found potential Tailwind v4 syntax issues:"
  echo "$MATCHES"
  echo ""
  echo "💡 Tip: Use CSS custom property shorthand syntax:"
  echo "   Instead of: focus:ring-[var(--love-300)]"
  echo "   Use:        focus:ring-(--love-300)"
  exit 1
fi

echo "✅ Tailwind syntax is valid!"
exit 0
