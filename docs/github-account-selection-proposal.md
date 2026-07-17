# GitHub sign-in — forcing account selection (backend proposal)

## Context

Google's OAuth flow shows an account chooser almost every time. GitHub's doesn't — once a browser
has an active GitHub session and has already granted this app's requested scopes, GitHub's
`/login/oauth/authorize` endpoint auto-approves and 302s straight back to the callback with no
page rendering, which reads as a brief "hesitate and flicker" instead of a picker. This doc covers
what's actually achievable here, and — importantly — what isn't.

## The hard limit: GitHub doesn't support a Google-style chooser

Google's picker exists because Google supports multiple simultaneous logged-in accounts in one
browser session. **GitHub does not** — github.com maintains exactly one active session per
browser (barring separate browser profiles or incognito). There is no GitHub OAuth parameter
equivalent to Google's `prompt=select_account`, because there's no second account in the same
session for it to select between. No backend change — ours or GitHub's OAuth app config — can add
a multi-account chooser that GitHub's platform doesn't support.

That's the honest ceiling. Everything below is real but narrower than "pick which account."

## What's actually possible

### 1. `login` parameter — suggest a specific username

GitHub's `/login/oauth/authorize` accepts an optional `login` parameter: "Suggests a specific
account to use for signing in and authorizing the app." It only has an effect when the browser
*isn't* already authenticated to GitHub — it prefills the username field on the login form. It
does nothing if a session already exists (GitHub still auto-approves through the existing session,
ignoring the hint).

Proposal: let the frontend pass an optional hint through to the backend's redirect:

`GET /auth/{provider}/signin?login_hint=<username>` → backend forwards it as `login=<username>` when
building the GitHub authorize URL it redirects to. Useful for "sign in as a specific GitHub
account" when the user explicitly knows which username they want and isn't currently
github.com-authenticated at all — not useful for switching between two already-active sessions,
since there's only ever one.

### 2. Force re-consent by revoking the stored grant server-side

If the backend has a stored access token for this GitHub identity, it can call GitHub's [Revoke a
grant for an application](https://docs.github.com/en/rest/apps/oauth-applications) API
(`DELETE /applications/{client_id}/grant`, app-authenticated with client_id/client_secret) before
redirecting. This makes GitHub show the "Authorize [App]" consent screen again on the next
attempt, instead of silently auto-approving.

This does **not** let the user pick a different GitHub account — it re-prompts consent for the
*same* account that's currently logged into the browser. It's useful for "make sure the user
consciously re-approves this app" (e.g. after a scope change), not for account switching.

This is the same mechanism already flagged in
[docs/version-control-api-proposal.md](./version-control-api-proposal.md)'s "Unlink should revoke
the token, not just delete the local association" — the same revoke call serves both: clean
disconnect on unlink, and forced re-consent before a fresh connect.

### 3. Real account switching requires the user to act, not the backend

The only way to actually sign in as a *different* GitHub account than the one active in the
browser is for the user to log out of github.com first (or use a different browser
profile/incognito window). No redirect trick or OAuth parameter bypasses this, because it's a
github.com session-level constraint, not an OAuth-flow-level one.

## Recommendation

Don't build a "chooser" — it can't exist for GitHub the way it does for Google. Instead:

1. Implement #1 (`login_hint` passthrough) — cheap, real value for the "I know which account I
   want and I'm not currently logged into GitHub" case.
2. Implement #2 (revoke-on-unlink) as already proposed in the version-control doc — makes
   "Disconnect" in Settings :: Plugins actually mean something server-side, and incidentally forces
   re-consent on the next connect attempt from the same account.
3. On the frontend: add a small hint in the GitHub connect UI — "Signed in to GitHub as the wrong
   account? [Log out of GitHub](https://github.com/logout) first, then reconnect." — sets accurate
   expectations instead of implying APIforge can switch accounts for you.

## Non-goals

- A multi-account chooser equivalent to Google's — not something GitHub's OAuth platform supports.
- Automatically logging the user out of github.com on their behalf — that's a third-party site
  action outside this app's authority to trigger without the user's explicit navigation there.
