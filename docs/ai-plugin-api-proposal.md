# AI plugin — backend API proposal

## Context

APIforge is getting a first-party plugin extension system (see the frontend work in
`src/lib/plugins/`), and AI is its first plugin: small "generate" / "improve" actions attached to
free-text fields (operation summary, request body description, response description, schema
description) plus whole-document actions (e.g. "explain this endpoint").

The frontend deliberately does **not** hold a model provider API key client-side — per
[docs/version-control-api-proposal.md](./version-control-api-proposal.md)'s precedent of keeping
third-party credentials server-side, the AI plugin calls a backend-proxied completion endpoint
instead of a BYOK (bring-your-own-key) model. This document sketches that endpoint.

## Design choice: one generic completion endpoint, not one per action

The backend doesn't need to know what "generate a description" or "explain this endpoint" means —
prompt construction is the frontend's job (easy to iterate on without a backend deploy). The
backend's job is just: accept a prompt, call whichever model provider it's configured with, hold
the provider API key, return the text. This keeps the endpoint stable while the frontend adds new
field actions freely.

### `POST /ai/complete`

Bearer-authed.

Request:
```json
{
  "system": "You write concise, professional OpenAPI operation summaries.",
  "prompt": "Method: GET\nPath: /users/{id}\nExisting summary: \"\"\nWrite a one-line summary.",
  "max_tokens": 200
}
```

Response:
```json
{ "text": "Retrieve a single user by ID." }
```

Errors:
- `401` — not signed in.
- `429` — rate limited (see below).
- `502`/`503` — upstream model provider error, forwarded as a generic failure (don't leak
  provider-specific error bodies to the frontend).

### `GET /ai/status`

Bearer-authed. Lets the frontend show "AI is available" vs. "AI is not configured for this
deployment" in Settings :: Plugins :: AI, instead of only discovering it on first failed call.

Response:
```json
{ "available": true, "model": "claude-sonnet" }
```

## Rate limiting / cost control

Model calls cost real money per request and this is a per-user "click a sparkle icon" affordance
— it's easy to fire off far more requests than a human would ever type by hand. Needs a per-user
rate limit (e.g. N completions/minute, returned via `429` with a `Retry-After` header) before this
ships, not as a follow-up.

## Non-goals for v1

- **Streaming responses.** Field actions generate a sentence or two — non-streaming is fine
  latency-wise, and it's a much simpler endpoint contract. Revisit if a "explain this whole spec"
  action needs longer output later.
- **Per-action endpoints or a prompt template system on the backend.** Keep prompt construction in
  the frontend; the backend stays a thin, generic proxy.
- **Conversation/chat history.** Every call is a single stateless prompt → completion; there's no
  multi-turn context to manage server-side.
