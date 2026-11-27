# Taplify

A small SaaS for public link pages, portfolios, contact forms, leads, and analytics.

This bootstrap implements the technical foundation from the general MVP plan. It includes a landing page, email and Google authentication, a session-protected dashboard shell, a Hono API, MongoDB connection helpers, a representative Typegoose model, and a Vercel Blob adapter. Taplify can use Google Analytics to measure visits with visitor consent. Page creation, editing, publishing, forms, leads, and analytics for page owners are future phases.

## Local development

Use Node.js 24 LTS (`.node-version`) and pnpm 12.21.0 (pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Open [localhost:3000](http://localhost:3000). The landing page and health endpoint work without external services. Configure MongoDB and Better Auth to enable registration and sign-in by email and password. Database and authentication configuration is validated lazily on the server using Zod, so a production build does not need credentials or a reachable database.

## Environment

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string; a replica set is required for the auth adapter's transactions. |
| `MONGODB_DB_NAME` | Database name, defaults to `taplify`. |
| `BETTER_AUTH_SECRET` | Random secret of at least 32 characters. |
| `BETTER_AUTH_URL` | Exact application origin, e.g. `http://localhost:3000`. |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth web application client ID. Set with the Google client secret to enable Google authentication. |
| `GOOGLE_CLIENT_SECRET` | Optional Google OAuth client secret. |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Optional GA4 web stream ID (`G-…`). Set it before building. |
| `BLOB_READ_WRITE_TOKEN` | Token for a public Vercel Blob store; required only for image storage. |

Generate an auth secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

To enable Google authentication, create a Google OAuth **Web application** client. Register `http://localhost:3000` as an authorized JavaScript origin and `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Add the equivalent production origin and callback for a stable deployment domain. Set `BETTER_AUTH_URL` to that same origin. See the [Better Auth Google guide](https://better-auth.com/docs/authentication/google).

Users can sign in at `/sign-in` and register at `/sign-up`. Email registration starts a session immediately. Google can create an account from either page.

Better Auth owns accounts, users, verification records, and sessions through its [MongoDB adapter](https://better-auth.com/docs/adapters/mongo). There is no Typegoose User model. The auth adapter receives the MongoClient to enable transactions. Use Atlas or a local replica set to exercise account creation.

## Cookie consent and analytics

Taplify shows the cookie banner until a visitor records a choice. Without a measurement ID, the banner explains necessary cookies and **Manage Cookies** shows the necessary storage used by Taplify. If GA4 is enabled later, Taplify asks visitors who recorded a necessary-only choice for their analytics preference. The Google tag loads only after a visitor allows **Analytics**. Sign-in and session cookies work with any preference. Taplify stores the choice for 180 days in the current browser and origin. Increment `COOKIE_CONSENT_VERSION` when the purposes or recipients of optional data collection materially change, and update `/cookie-policy` to match the integrations offered.

Use a GA4 web stream for Taplify and turn off **Enhanced measurement** in its stream settings. The app sends one `page_view` for each page after consent, including App Router navigation. When adding a page, update the measured paths in `TaplifyAnalytics` with a path suitable for analytics. The app reports unknown paths as `/404` so mistyped URLs stay out of GA4.

Set the measurement ID for the intended Vercel environment and redeploy to apply it. On a test deployment, use a test GA4 property and verify the current page and client-side navigations in DebugView. In the browser network panel, confirm that declining or withdrawing consent blocks further GA4 traffic, then check that Google sign-in still works.

## Structure and boundaries

```text
src/
  app/                        Next.js App Router pages and layouts
    api/[[...route]]/route.ts  Node.js entry point for /api/*
    dashboard/                Session-protected dashboard shell
    (auth)/                   Sign-in and registration pages with a shared layout
  components/
    auth/                     Client sign-in and sign-out controls
    ui/                       shadcn-style components
  lib/                        Shared UI helpers and browser auth client
  server/
    api/app.ts                Hono routing and JSON error handling
    auth.ts                   Lazy Better Auth instance
    db/                       Cached MongoDB and Mongoose connections
      models/media-asset.ts   Explicitly typed Typegoose model
    services/                 HTTP-independent server functions
    storage/blob.ts           Server-side Vercel Blob adapter
tests/
  unit/                       Vitest foundation checks
  e2e/                        Playwright production smoke checks
scripts/                      Database ping and additive index creation
```

Server modules import `server-only`. Hono and Server Components can call services directly; services do not depend on Hono or Next request APIs. Every future owner API must verify the session **and** resource ownership. Dashboard layout protection alone does not authorize APIs or Server Actions.

The two cached connection pools serve the same database: the native driver serves Better Auth; Mongoose serves application models. Both reset rejected connection promises and cap each pool at five connections. Tune these caps for deployment concurrency and Atlas limits.

`GET /api/health` is a liveness/compiler check: it constructs the Typegoose model without querying MongoDB. It is not a database readiness check. Unknown API routes return JSON 404s. API failures log only an event name, request ID, and error type; raw errors, request bodies, cookies, and tokens are excluded.

The Blob adapter accepts JPEG, PNG, and WebP metadata up to 2 MB. It is not exposed as an upload endpoint. The future media service must authenticate the owner, inspect actual file signatures, persist the MediaAsset, and handle cleanup after failed persistence.

## Typegoose and UI configuration

Typegoose 13.5 and Mongoose 9.9.5 follow the upstream [compatibility matrix](https://typegoose.github.io/typegoose/docs/guides/mongoose-compatibility/). Keep their versions aligned when upgrading.

Legacy decorators are enabled with `experimentalDecorators`. Every `@prop` supplies an explicit `type`, so model construction does not depend on emitted decorator metadata. `reflect-metadata` is loaded before model definitions. The model has an explicit `customName`, and reflection-sensitive packages stay external to the Next server bundle. The health smoke test also exercises this setup in the production build. See [Typegoose compiler caveats](https://typegoose.github.io/typegoose/docs/guides/known-issues/).

Tailwind CSS 4 uses the PostCSS plugin and CSS theme variables. `components.json`, `cn`, and the Button component provide the shadcn/ui starting point. Add components as needed:

```sh
pnpm dlx shadcn@latest add input card
```

## Checks

GitHub Actions runs CI on every push and pull request; it can also be started manually from the Actions tab. Lint, type checking, unit tests, and production browser tests report separate statuses, so a lint failure does not prevent tests from running. For a push containing multiple commits, CI checks the latest commit.

Failed checks appear on the commit and in the Actions tab after the push has been accepted. The workflow does not reject pushes or configure branch protection. To keep merging optional when checks fail, leave these checks out of required status checks in the repository's branch protection or rulesets.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts the **production** server, so build first. The smoke suite covers the landing and authentication screens, the anonymous dashboard redirect, and model execution through Hono. Verify Google OAuth separately on a stable registered deployment URL. Add database integration tests with an isolated test database when page access and publishing services are introduced.

To use an installed Chrome instead of downloading Chromium, set `PLAYWRIGHT_CHANNEL=chrome` (PowerShell: `$env:PLAYWRIGHT_CHANNEL = "chrome"`) before `pnpm test:e2e`.

With `.env.local` configured:

```sh
pnpm db:check
pnpm db:indexes
```

Mongoose automatic index creation is disabled. `db:indexes` additively creates the current application index (`media_assets`: `ownerId`, `createdAt`); it never drops indexes. Extend the script alongside new models. Better Auth manages its own collection indexes through its adapter; check initialization logs and verify uniqueness indexes before opening registration to traffic.

## Vercel

Import this repository into a single Vercel project with the **Next.js** preset, Node.js **24.x**, install command `pnpm install --frozen-lockfile`, and build command `pnpm build`. Add the environment variables above to the appropriate environments, configure Atlas network access, and connect a public Blob store. All database/API code uses the Node.js runtime.

After deployment, check `/api/health`, email registration and sign-in, Google sign-in if configured, sign-out, the dashboard redirect, Atlas connectivity, and index creation. Use Vercel request/function logs for diagnostics while keeping form answers and secrets out of logs.
