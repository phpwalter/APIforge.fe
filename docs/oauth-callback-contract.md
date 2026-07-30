# OAuth Callback Contract

APIForge does not accept bearer tokens or provider authorization codes in frontend callback URLs.

## Public frontend callback route

The React application exposes this route without requiring an existing APIForge session:

```text
/oauth/callback
```

The backend redirects the browser to that route with a short-lived, single-use APIForge code and the provider that completed authentication:

```text
http://localhost:5173/oauth/callback?code=<opaque-one-time-code>&provider=google
```

The route must not be redirected to `/signin` or another protected page before the exchange finishes.

## Sign-in and link completion

The callback page:

1. Reads `code` and `provider` from the URL.
2. Correlates `provider` with the pending browser flow when a pending marker exists.
3. Removes the sensitive query string from browser history.
4. Exchanges the code through the API.
5. Stores the returned bearer token in module memory only.
6. Hydrates the authenticated user and provider state.
7. Replaces the callback route with `/` only after the exchange succeeds.

Exchange request:

```http
POST /auth/session/exchange
X-API-Version: v1
Content-Type: application/json

{
  "code": "opaque-one-time-code",
  "provider": "google"
}
```

Successful response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "display_name": "User Name",
    "avatar_url": "https://example.com/avatar.png"
  },
  "token": {
    "token_type": "Bearer",
    "access_token": "...",
    "expires_in": 3600
  },
  "new_user": false,
  "linked_profile": {
    "provider": "github",
    "username": "octocat",
    "avatar_url": "https://example.com/avatar.png"
  }
}
```

`linked_profile` is optional and is returned only when the completed flow linked an additional provider.

## Failure behavior

The callback page remains public and displays an actionable failure state when:

- `code` or `provider` is missing;
- the callback provider conflicts with the pending browser flow;
- the code is expired, invalid, or already consumed;
- the exchange response does not contain an access token;
- the exchange request fails.

No protected application route is entered after a failed exchange.

## Security requirements

- The APIForge exchange code is single-use and expires within five minutes.
- The backend validates OAuth state and PKCE before issuing the exchange code.
- The exchange code is bound to the provider, browser flow, and intended frontend origin.
- Exchange responses use `Cache-Control: no-store`.
- Bearer tokens are never placed in URLs, logs, HTML, localStorage, sessionStorage, or IndexedDB.
- Callback query parameters are removed from browser history before the exchange request.
- Until a secure refresh-token mechanism exists, reloading the page ends the frontend session.

## Frontend callback compatibility

The frontend recognizes the one-time OAuth callback before normal authentication routing in either form:

```text
/oauth/callback?code=<opaque-code>&provider=<provider>
/?code=<opaque-code>&provider=<provider>
```

The dedicated `/oauth/callback` form remains preferred. Root-query compatibility prevents an unauthenticated landing-page render when an existing backend configuration redirects to the frontend origin without the callback path.
