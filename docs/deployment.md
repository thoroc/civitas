# Deployment

Two modes:

- SSR / ISR capable (default): `bun run build`
- Static export: `bun run build:static` (loss of Next.js `headers()`; replicate security headers manually)

## Security Headers

Configured in `next.config.mjs` (SSR only): CSP, HSTS, Frame isolation, Referrer Policy, Permissions Policy,
COOP/COEP/CORP.

Static export: use platform (Vercel project settings) or an alternate proxy to supply equivalent headers.

## Artifacts

CI produces:

- `.next` (SSR) build artifact
- `out/` (static export) artifact

## Verification

Check headers:

```bash
curl -I https://<deployment>/
```

Look for `Content-Security-Policy` & `Strict-Transport-Security`.

---

## GitHub Actions Automated Deployment

### Triggers

| Job                      | Trigger             | Command                               |
| ------------------------ | ------------------- | ------------------------------------- |
| `deploy-ssr`             | Push to `main`      | `bun run build` → Vercel production   |
| `deploy-static`          | Push tag `v*`       | `bun run build:static` → Vercel alias |
| `deploy-static` (manual) | `workflow_dispatch` | Dry-run / preview                     |

Both jobs **skip cleanly** (no failure) when Vercel secrets are absent — safe for forks and open PRs.

### Required Secrets

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret              | Where to find it                                             |
| ------------------- | ------------------------------------------------------------ |
| `VERCEL_TOKEN`      | Vercel dashboard → Account Settings → Tokens                 |
| `VERCEL_ORG_ID`     | Vercel dashboard → Team/Account Settings → General (Team ID) |
| `VERCEL_PROJECT_ID` | Vercel project → Settings → General (Project ID)             |

### Workflow file

`.github/workflows/deploy.yml` — created as part of CI setup (see `ci/deployment-automation` branch).

### Skip behaviour

When any of the three secrets is absent the deploy step is skipped with a clear log message:

```text
Vercel secrets not configured — skipping deploy
```

The job exits 0. No red CI.

### Adding secrets to Vercel project

```bash
# Install Vercel CLI globally if needed
bun add -g vercel

# Link the project (run once in repo root)
vercel link

# The .vercel/project.json file will contain VERCEL_ORG_ID and VERCEL_PROJECT_ID
cat .vercel/project.json
```
