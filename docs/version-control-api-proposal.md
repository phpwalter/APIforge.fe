# Version Control :: GitHub — backend API proposal

## Context

Settings :: Version Control now supports connecting a GitHub account via a real OAuth round trip
(frontend: `redirectToProviderLink` in `src/lib/api/auth.ts`, built on `GET /auth/github/link` →
`/auth/github/callback` → `POST /auth/github/link` to finalize). That connection currently proves
account ownership and nothing else — the token the callback hands back is an APIforge-issued JWT,
not a usable GitHub API token, and there is no backend surface for actually reading or writing
repo content yet.

**Known gap as of this doc's last update**: `GET /auth/{provider}/link` currently returns `405
Method Not Allowed` — only the existing `POST /auth/{provider}/link` (finalize) is implemented at
that path. The frontend already redirects to `GET /auth/{provider}/link` expecting a GET handler
alongside the POST (mirroring how `GET /auth/{provider}/signin` now exists as its own path,
separate from whatever used to live at bare `/auth/{provider}`) — this needs a GET route added
before "Connect with GitHub" actually works end-to-end again.

This document sketches the backend work needed to make the connection do something: export a
REST Projection spec to a GitHub repo, and import one from a repo.

## Prerequisite: OAuth scope

The OAuth authorization request captured from `GET /auth/github/signin` currently requests only
`scope=read:user user:email` — identity, no repo access. That's correct for plain sign-in, but
insufficient for Version Control.

Proposal: `GET /auth/{provider}/link` (once it exists as a GET route — see the gap noted above)
accepts an `intent` query param (e.g. `intent=version_control`) that the backend uses to pick a
wider OAuth scope — `repo` (private + public) or `public_repo` (public-only) — before redirecting
to GitHub's consent screen. Sign-in keeps the narrow identity scope; only the Version Control
"Connect" action asks for repo access.

## New endpoints

All bearer-authed. All are server-side calls to GitHub's REST API using the token already stored
against the user from the existing `/auth/github/link` flow — the frontend never sees a GitHub
token.

### `GET /repos/github`

List repos the linked account can access (for a repo picker).

Query: `page`, `per_page`, `q` (optional search/filter).

Response:
```json
[
  { "id": 123, "full_name": "octocat/hello-world", "private": false, "default_branch": "main", "html_url": "https://github.com/octocat/hello-world" }
]
```

### `GET /repos/github/{owner}/{repo}/branches`

List branches for the branch picker.

Response:
```json
[{ "name": "main", "protected": true }]
```

### `GET /repos/github/{owner}/{repo}/contents?path=&ref=`

Browse a directory or read a file. Mirrors GitHub's own Contents API shape 1:1 — this can
essentially proxy GitHub's response, minimizing new schema design.

Directory response:
```json
[{ "name": "openapi.yaml", "path": "openapi.yaml", "type": "file", "sha": "abc123" }]
```

File response:
```json
{ "name": "openapi.yaml", "path": "openapi.yaml", "sha": "abc123", "content": "<base64>", "encoding": "base64" }
```

### `PUT /repos/github/{owner}/{repo}/contents/{path}`

Create or update a file — the actual "Export to GitHub" commit.

Request body:
```json
{ "content": "<base64 or raw>", "message": "Update OpenAPI spec via APIforge", "branch": "main", "sha": "abc123" }
```
`sha` is required when overwriting an existing file, omitted when creating a new one — same rule
GitHub's own Contents API uses.

Response:
```json
{ "commit": { "sha": "def456", "html_url": "https://github.com/octocat/hello-world/commit/def456" }, "content": { "sha": "ghi789", "path": "openapi.yaml" } }
```

## Also worth including

- **`GET /auth/me` should report linked identities** — e.g. `linked_providers: ["github"]`, with
  per-provider username. Today the frontend's "connected" status is optimistic localStorage state
  (`src/lib/versionControlLinks.ts`), never verified against the backend on load. A revoked or
  expired link would still show as "Connected" until an action against it fails. Surfacing linked
  providers on `/auth/me` closes that gap.
- **Unlink should revoke the token**, not just delete the local association — call GitHub's OAuth
  token revocation endpoint from `/auth/github/unlink`.
- **Token storage**: decide GitHub OAuth App vs. GitHub App up front. Classic OAuth App tokens
  don't expire; a GitHub App's tokens do and need refresh-token handling, which changes the data
  model for where/how the token is stored per user.

## Non-goals for v1

Branch creation, pull requests, webhooks, multi-file commits. A single-file read/write round trip
covers "export this spec to a repo" and "import a spec from a repo," which is the feature this
unlocks on the frontend today.
