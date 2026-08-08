import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOAuthProviders } from "./oauthProviders";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchOAuthProviders", () => {
  it("accepts the single data envelope and sorts by display order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        data: [
          {
            code: "github",
            display_name: "GitHub",
            supports_pkce: true,
            supports_oidc: false,
            default_scopes: ["read:user", "user:email"],
            signin_endpoint: "/auth/github/signin",
            callback_endpoint: "/auth/github/callback",
            exchange_endpoint: "/auth/session/exchange",
            display_order: 20,
          },
          {
            code: "google",
            display_name: "Google",
            supports_pkce: true,
            supports_oidc: true,
            default_scopes: ["openid", "email", "profile"],
            signin_endpoint: "/auth/google/signin",
            callback_endpoint: "/auth/google/callback",
            exchange_endpoint: "/auth/session/exchange",
            display_order: 10,
          },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const providers = await fetchOAuthProviders();
    expect(providers.map((provider) => provider.code)).toEqual(["google", "github"]);
  });
});
