#!/usr/bin/env bash
# Enforces project coding conventions for TypeScript files.
# Usage: bash scripts/check-conventions.sh <file1> <file2> ...
#
# Conventions checked:
#   [no-class]               No class declarations — use arrow functions + plain objects
#   [arrow-only]             No named function declarations — use arrow functions
#   [one-function-per-module] Max 1 exported function per non-barrel module
#   [no-internal-function]   No functions defined inside other functions
#   [max-function-lines]     Function body must not exceed 80 lines
#
# Note: cognitive complexity (threshold 12) is enforced by Biome's
#       complexity/noExcessiveCognitiveComplexity rule, not this script.

set -euo pipefail

ERRORS=0
MAX_FN_LINES=80

for file in "$@"; do
  # Only process TypeScript files
  [[ "$file" =~ \.(ts|tsx)$ ]] || continue
  # Skip type declaration files
  [[ "$file" =~ \.d\.ts$ ]] && continue
  # Skip node_modules
  [[ "$file" =~ node_modules ]] && continue

  is_barrel=false
  [[ "$file" =~ (^|/)index\.(ts|tsx)$ ]] && is_barrel=true

  is_test=false
  [[ "$file" =~ \.(spec|test)\.(ts|tsx)$ ]] && is_test=true

  # Top-level CLI entry scripts predate the module conventions; exempt them from
  # arrow-only, no-internal-function, and max-function-lines checks.
  is_script=false
  [[ "$file" =~ scripts/[^/]+\.(ts|tsx)$ ]] && is_script=true

  # --- [no-class]: No class declarations ---
  if grep -qnE '^\s*(export\s+)?(abstract\s+)?class\s+[A-Za-z]' "$file"; then
    echo "FAIL [no-class] $file"
    grep -nE '^\s*(export\s+)?(abstract\s+)?class\s+[A-Za-z]' "$file" | head -3 | sed 's/^/       /'
    echo "       → Use arrow functions and plain objects instead of classes."
    ERRORS=$((ERRORS + 1))
  fi

  # --- [arrow-only]: No named function declarations ---
  # (Allowed in test files where describe/it wrappers are common)
  if ! $is_test && ! $is_script && grep -qnE '^\s*(export\s+)?(async\s+)?function\s+[A-Za-z]' "$file"; then
    echo "FAIL [arrow-only] $file"
    grep -nE '^\s*(export\s+)?(async\s+)?function\s+[A-Za-z]' "$file" | head -3 | sed 's/^/       /'
    echo "       → Use arrow functions: const foo = () => { ... }"
    ERRORS=$((ERRORS + 1))
  fi

  # --- [one-function-per-module]: Max 1 exported function per module ---
  # Barrel files (index.ts) are excluded — they exist specifically to re-export.
  if ! $is_barrel; then
    # Count exported arrow functions: lines starting with `export const/let <camelCase>`
    # that also contain `=>` (same-line arrow syntax covers the common case).
    fn_count=$(grep -E '^export (const|let) [a-z]' "$file" | grep -c '=>' 2>/dev/null || true)
    # Add default exports (each file can have at most one, but count it toward the total)
    default_count=$(grep -cE '^export default ' "$file" 2>/dev/null || true)
    total=$((fn_count + default_count))

    if [ "$total" -gt 1 ]; then
      echo "FAIL [one-function-per-module] $file ($total exported functions, max 1)"
      echo "       → Split into separate modules, one function per file."
      ERRORS=$((ERRORS + 1))
    fi
  fi

  # --- [no-internal-function]: No functions defined inside other functions ---
  # Detects indented arrow function assignments: `  const fn = (async )? (` on a line
  # that also contains `=>`. This reliably catches inner helpers while avoiding false
  # positives from hook calls like `useMemo(() => ...)` where `=` is not immediately
  # followed by `(`.
  # Test files are exempt (describe/it/beforeEach callbacks are a standard pattern).
  if ! $is_test && ! $is_script; then
    inner=$(grep -nE '^\s+(const|let) [a-z][A-Za-z0-9_]* = (async )?\(' "$file" | grep '=>' || true)
    if [ -n "$inner" ]; then
      echo "FAIL [no-internal-function] $file"
      echo "$inner" | head -3 | sed 's/^/       /'
      echo "       → Extract inner functions into their own modules."
      ERRORS=$((ERRORS + 1))
    fi
  fi

  # --- [max-function-lines]: Function body must not exceed 80 lines ---
  # Barrel and test files are excluded.
  # Since modules contain exactly one function (per [one-function-per-module]),
  # substantive code line count is a reliable proxy for function body length.
  # "Substantive" lines exclude: blank lines, comments, import statements, and
  # standalone type/interface declarations — i.e. lines that are not function body.
  if ! $is_barrel && ! $is_test && ! $is_script; then
    fn_lines=$(grep -cvE '^\s*(//|/\*|\*|import |export type |export interface |type [A-Z]|interface [A-Z]|\}?\s*$)' "$file" 2>/dev/null || true)
    if [ "$fn_lines" -gt "$MAX_FN_LINES" ]; then
      echo "FAIL [max-function-lines] $file (~$fn_lines substantive lines, max $MAX_FN_LINES)"
      echo "       → Break the function into smaller focused helpers (each in its own module)."
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "$ERRORS convention violation(s). See CONTRIBUTING.md § Code Conventions."
  exit 1
fi

exit 0
