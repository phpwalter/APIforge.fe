import { beforeEach, describe, expect, it, vi } from "vitest";
import { writeAuthSession } from "../authSession";
import { signOut } from "../signout";

describe("signOut", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("revokes the bearer token and clears local session state", async () => {
    writeAuthSession({ accessToken: "token-value", provider: "google" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await signOut();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/auth/signout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-value" }),
      }),
    );
    expect(window.sessionStorage.length).toBe(0);
  });

  it("clears local state even when the API is unavailable", async () => {
    writeAuthSession({ accessToken: "token-value" });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network failure"));

    await expect(signOut()).rejects.toThrow("network failure");
    expect(window.sessionStorage.length).toBe(0);
  });
});
