# APIForge Frontend

APIForge is a visual OpenAPI design application built with React, TypeScript, Vite, Zustand, Monaco Editor, and Monaco YAML. It supports endpoint and schema design, OpenAPI import/export, OAuth sign-in, and source-control integrations.

## Requirements

- Node.js 22.12 or later; `.nvmrc` currently pins 22.16.0
- npm 10 or later
- APIForge API server available locally or over HTTPS

## Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Local configuration:

```env
API_PROXY_TARGET=http://apiforge.api
VITE_API_SERVER=http://apiforge.api
VITE_DEBUG=false
```

`API_PROXY_TARGET` is used only by the local Vite development server. Browser requests use canonical same-origin paths such as `/auth/providers`; Vite forwards them to `http://apiforge.api/auth/providers`, avoiding browser CORS enforcement. `VITE_API_SERVER` is embedded in production builds and must never contain secrets.

## Commands

```bash
npm run dev              # Development server
npm run lint             # Oxlint, warnings fail the command
npm run typecheck        # Application and build configuration
npm run typecheck:tests  # Test source type-check
npm test                 # Unit/component tests
npm run test:coverage    # Coverage; thresholds are 100%
npm run build            # Type-check and production bundle
npm run check            # Complete local quality gate
```

Vitest coverage requires `@vitest/coverage-v8@1.6.0`, pinned to the current Vitest major. CI installs that exact provider without changing the committed lock file.

## API versioning

Every fetch-based API operation declares its required engine version at its call site. The shared client sends that value in `X-API-Version`. Do not add a global default: endpoint owners must deliberately select the version they consume.

Full-page OAuth initiation cannot attach custom request headers. The sign-in initiation route is therefore treated as a bootstrap route; the code-exchange request is versioned normally.

## Authentication

OAuth callbacks return an opaque, short-lived, single-use `code`, never a bearer token. The frontend exchanges the code through `POST /auth/session/exchange`. See `docs/oauth-callback-contract.md`.

Bearer access tokens are held in JavaScript module memory only. They are not written to browser storage. Until the backend supplies a secure refresh mechanism, reloading the page ends the frontend session.

## OpenAPI preservation

Imported OpenAPI fragments retain their original raw objects alongside the visual model. On export, editor-owned fields override the preserved fragment while unsupported fields remain intact. This prevents silent data loss when APIForge opens and saves documents containing features the UI cannot yet edit.

## Source layout

- `src/components` — feature and presentation components
- `src/state` — Zustand application and specification state
- `src/lib/api` — versioned API client and endpoint wrappers
- `src/lib/openapiImport.ts` — OpenAPI parser and preservation layer
- `src/lib/openapiExport.ts` — OpenAPI compiler and preservation merge
- `src/types` — shared domain contracts
- `docs` — backend contracts and deployment guidance

## Production deployment

The production server must route `/api/*` to the backend or serve the backend on the same origin. Configure the response headers in `docs/production-security-headers.md`. Keep source maps, environment files, credentials, and OAuth secrets out of the published frontend assets.

## Dependency policy

Major framework upgrades are intentionally deferred until the current security, type-check, test, coverage, and build gates are green. Apply dependency upgrades in isolated pull requests, review release notes and migration guides, and verify OpenAPI round-trip fixtures before merging.

## Bundle architecture

The production build keeps the main application separate from large, independently cacheable editor dependencies. Rollup assigns stable chunks for React and Zustand, Monaco Editor, Monaco YAML and its language-server dependencies, the OpenAPI 3.1 schema catalog, and document-processing utilities.

Monaco-powered views remain loaded through dynamic imports, so editor code is not part of the initial application route. Do not import `src/lib/monaco/setup.ts` from an eagerly loaded component. Review the generated `dist/assets` sizes after dependency upgrades; an increase in the main application chunk should be investigated rather than hidden by raising Vite's warning limit.
