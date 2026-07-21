# Database setup

Production data lives in the Turso database `eweehadb` (the **parent**):
`libsql://eweehadb-vercel-icfg-pktaaspulyfmrzvxkmdeypo0.aws-us-east-1.turso.io`

## Why TURSO_URL_OVERRIDE exists

The Turso/Vercel marketplace integration is configured with a "branch on deployment"
action: every production deployment gets a **fork** of the parent DB (named
`dpl-<deployment-id>`), and `TURSO_DATABASE_URL` points at that fork. Admin edits made
while a deployment is live land in its fork — the next deployment forks the stale
parent again, and those edits silently "disappear" (incidents on Jul 16, Jul 18 and
Jul 21 2026).

`src/lib/turso.ts` and `scripts/migrate.ts` therefore prefer:

- `TURSO_URL_OVERRIDE` — pinned to the parent DB URL
- `TURSO_TOKEN_OVERRIDE` — a token for the parent

Both are set as plain Vercel env vars (Production + Preview). With these set, the
integration's branch databases are created but never used; all reads/writes hit the
parent, and deployments can no longer orphan data.

## If you rotate Turso tokens

Update `TURSO_TOKEN_OVERRIDE` in Vercel env vars as well, then redeploy.

## Emergency tooling

- `scripts/rescue-branches.mjs` — dump any branch DB to `backups/` (needs GROUP_TOKEN env)
- `scripts/scan-all-branches.mjs` — survey all deployment branch DBs for data
- `scripts/restore-fleet.mjs` — restore a dumped vehicles table into live DBs
