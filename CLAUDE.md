# CLAUDE.md — Competitor Pricing & Licensing Wizard

## WORKFLOW
- Work in small atomic steps. One task, one change, one commit.
- Stop and request explicit developer sign-off before:
  - Creating or deleting any file
  - Modifying any auth, middleware, or database schema file
  - Installing or removing a dependency
  - Running any script that writes to disk, a database, or an external service
  - Making any change that touches more than one logical concern
- Never batch unrelated changes.
- Do not auto-commit. Propose a commit message and wait for confirmation.
- Commit message format: `<type>(<scope>): <short description>`
- Do not refactor, reformat, or rename anything outside the scope of the current task.

## STUDENT DATA & COMPLIANCE
- This is an internal PMM tool. It does not process student data.
- Do not add any feature that would collect, store, or transmit student PII (names,
  emails, ages, scores, or identifiers). If a proposed feature would do this, stop
  and flag it before implementing.
- Never include user data of any kind in AI/LLM prompts unless it is internal
  business data (competitor pricing, state licensing requirements).

## SECRETS & ENV
- Never write credentials or secrets into source files.
- All secrets via `process.env`. If a new variable is needed, add it to `.env.example`
  with a placeholder and note it in the response.
- Never log env vars, tokens, or user PII.
- `.env.local` and all `.env*` variants are gitignored — never force-add them.

## CLERK — AUTHENTICATION
- Use Clerk for all authentication. Do not implement custom auth flows.
- Always read the current user from the Clerk session server-side via `auth()`.
  Never trust `userId` from the request body.
- The Clerk middleware in `src/middleware.ts` protects all routes except `/sign-in`.
  Any new public route must be explicitly added to `createRouteMatcher`.
- For expensive or destructive API routes (e.g. `/api/monitor`), add an explicit
  in-route `auth.protect()` call as defense-in-depth, even though middleware covers it.

## DATABASE — Neon / Drizzle
- All queries must use Drizzle ORM operators (`eq`, `and`, `or`, etc.).
  No string interpolation of user input into queries — ever.
- Connection string in `DATABASE_URL` environment variable only.
- Schema changes require a new file in `src/db/schema/` and a migration via
  `npm run db:generate` + `npm run db:push`. Never mutate the schema in app code.
- All collection endpoints must have a `.limit()` guard. No unbounded queries.

## API ROUTES
- All model API calls (Anthropic, OpenAI) must be server-side only.
  Never call a model API from a client component or expose an API key to the browser.
- Error responses in production must be generic. Stack traces and internal paths
  are conditionally gated on `NODE_ENV === 'development'` — keep it that way.
- `/api/monitor` is expensive (calls Anthropic + Firecrawl). Any change to it
  requires explicit approval. Do not add new callers without rate-limit discussion.

## RAILWAY DEPLOYMENT
- Secrets go in Railway environment variables only. Nothing sensitive in the repo.
- Log to stdout/stderr only — no local file logging.
- The `/api/health` endpoint must remain functional for Railway health checks.
- Staging and production must use separate credentials.

## LOGGING
- Do not add `console.log` calls that fire on every request in production.
  Request-level logs in middleware should be development-only.
- Never log API keys, tokens, database URLs, or user identifiers.
