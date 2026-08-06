import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedApiRequest, ApiRequestError, AuthenticationRequiredError } from "../authenticatedApi";
import { readAuthSession, writeAuthSession } from "../authSession";

describe("authenticatedApiRequest", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("adds APIForge authentication headers", async () => {
    writeAuthSession({ accessToken: "token-1" });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await authenticatedApiRequest("/auth/me", { method: "POST" });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(request.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-1");
    expect(headers.get("X-API-Version")).toBe("v1");
  });

  it("clears the stored session after HTTP 401", async () => {
    writeAuthSession({ accessToken: "revoked-token" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: "Unauthorized", detail: "Token revoked." }), {
          status: 401,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    await expect(authenticatedApiRequest("/auth/me", { method: "POST" })).rejects.toBeInstanceOf(
      AuthenticationRequiredError,
    );
    expect(readAuthSession()).toBeNull();
  });

  it("preserves the session after HTTP 403", async () => {
    writeAuthSession({ accessToken: "valid-token" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    await expect(authenticatedApiRequest("/protected")).rejects.toBeInstanceOf(ApiRequestError);
    expect(readAuthSession()?.accessToken).toBe("valid-token");
  });
});
