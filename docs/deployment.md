# Deployment

Two modes:

- SSR / ISR capable (default): `npm run build`
- Static export: `npm run build:static` (loss of Next.js `headers()`; replicate security headers manually)

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
