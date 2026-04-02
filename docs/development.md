# Development

## Setup

```bash
bun install
bun dev
```

## Quality Commands

- `bun run lint` / `lint:fix`
- `bun run lint:md`
- `bun run lint:lockfile`
- `bun run format` / `format:check`
- `bun run type-check`

## Parameter Options Convention

Functions with >2 scalar parameters must take a single options object. Interface naming: `<Verb><Noun>Options`.

## Pre-commit Hooks

Lefthook runs lint, prettier, markdownlint, types, and a blocking lockfile integrity check on staged
`bun.lock`.

## Tooling Enhancements

- `prettier-plugin-packagejson` auto-sorts `package.json` fields (enforced via existing Prettier hook).
- `lockfile-lint` ensures the lockfile only references HTTPS endpoints and the approved host (`registry.npmjs.org`).
  Run manually with `bun run lint:lockfile` or rely on CI step.

## MCP Servers

Project MCP servers are configured in `.mcp.json` and activate automatically in Claude Code.

| Server | Package | Purpose |
| --- | --- | --- |
| `vercel` | `mcp-remote` → `https://mcp.vercel.com` | Deployment management, logs, preview URLs |
| `uk-parliament` | `uk-parliament-mcp` | Live UK Parliament data: MP profiles, voting history, financial interests, bills, petitions |

No API keys are required for `uk-parliament-mcp`.

## Adding Filters

1. Extend `ParliamentFiltersState`
2. Update `apply()` logic
3. Adjust `reset` if needed
4. Add UI controls and badges

## Performance Notes

Memoize O(n) derivations; keep components pure; avoid unnecessary re-renders via stable callbacks.
