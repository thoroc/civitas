# Development

## Setup

```bash
npm install
npm run dev
```

## Quality Commands

- `npm run lint` / `lint:fix`
- `npm run lint:md`
- `npm run format` / `format:check`
- `npm run type-check`

## Parameter Options Convention

Functions with >2 scalar parameters must take a single options object. Interface naming: `<Verb><Noun>Options`.

## Pre-commit Hooks

Lefthook runs lint, prettier, markdownlint, types.

## Adding Filters

1. Extend `ParliamentFiltersState`
2. Update `apply()` logic
3. Adjust `reset` if needed
4. Add UI controls and badges

## Performance Notes

Memoize O(n) derivations; keep components pure; avoid unnecessary re-renders via stable callbacks.
