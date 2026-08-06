import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreAuthSession } from "../sessionRestoration";
import { writeAuthSession } from "../authSession";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("restoreAuthSession", () => {
  it("returns anonymous when no session is stored", async () => {
    await expect(restoreAuthSession()).resolves.toEqual({ status: "anonymous" });
  });

  it("restores a valid profile through POST /auth/me", async () => {
    writeAuthSession({ accessToken: "valid-token", provider: "google" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              user: { id: "user-1", email: "person@example.com", display_name: "Example Person" },
              company: { id: "company-1", name: "Example Company" },
              roles: [{ role_code: "administrator" }],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await restoreAuthSession();
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.profile.displayName).toBe("Example Person");
      expect(result.profile.companyName).toBe("Example Company");
      expect(result.profile.roles).toEqual(["administrator"]);
    }
  });

  it("returns anonymous when the stored token is rejected", async () => {
    writeAuthSession({ accessToken: "expired-token" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Token expired." }), {
          status: 401,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    await expect(restoreAuthSession()).resolves.toEqual({ status: "anonymous" });
  });
});
