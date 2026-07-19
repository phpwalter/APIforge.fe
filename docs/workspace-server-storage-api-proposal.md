# Workspace server storage — backend API proposal

## Context

Every workspace today is stored client-side only (`src/lib/workspaces.ts`, localStorage, capped at
10 entries) — there's no concept of "this user's projects" on the backend at all. The Topbar ::
More actions menu has grown three UI surfaces that assume real server storage exists:

- **Load Workspace** dialog — lists this user's projects from the server (currently wired to
  `GET /workspaces` / `GET /workspaces/:id`, both proposed below; frontend built against the
  proposal, so it shows an error state until the backend implements it — see
  `src/lib/api/workspaces.ts`, `src/components/Workspace/LoadWorkspaceDialog.tsx`).
- **Save Workspace :: Save to Server** menu item — disabled placeholder ("Coming soon"), not
  wired to anything yet.
- **Workspace Settings :: General**'s green **Save** button (shown instead of OK for a
  brand-new, not-yet-saved workspace) — also disabled, same reason.

This document sketches the minimum backend surface to make all three real.

## New endpoints

All bearer-authed, scoped to the calling user (no cross-user access).

### `GET /workspaces`

List this user's saved projects (for Load Workspace's list pane).

Response:
```json
[
  { "id": "ws_abc123", "name": "Billing API", "updatedAt": "2026-07-18T14:32:00Z" }
]
```

### `GET /workspaces/{id}`

Fetch one project's full document (Load Workspace's "Open" action).

Response:
```json
{
  "id": "ws_abc123",
  "name": "Billing API",
  "updatedAt": "2026-07-18T14:32:00Z",
  "specJson": "{\"openapi\":\"3.1.0\", ...}"
}
```
`specJson` is a serialized OpenAPI document — same shape `src/lib/openapiExport.ts` already
produces, so the response can be stored and returned as an opaque blob without the backend needing
to understand OpenAPI structure.

### `POST /workspaces`

Create a new saved project (Save Workspace :: Save to Server, and Workspace Settings' Save
button, for a brand-new workspace).

Request:
```json
{ "name": "Billing API", "specJson": "{\"openapi\":\"3.1.0\", ...}" }
```
Response: same shape as `GET /workspaces/{id}`, with the server-assigned `id`.

### `PUT /workspaces/{id}`

Update an already-saved project's name and/or document (Save, for a workspace that already has a
server id).

Request/response: same shape as `POST /workspaces`.

### `DELETE /workspaces/{id}`

Permanently delete a project. **Not** what Recent Workspaces' new remove-from-list icon does —
that only drops the local pointer (`src/lib/workspaces.ts`'s `deleteWorkspace`); this is a real,
destructive delete, for whatever surface eventually exposes it (not built on the frontend yet).

## Non-goals for v1

Sharing/collaboration, version history, conflict resolution for concurrent edits. A single owner,
last-write-wins model covers what the frontend needs today.
