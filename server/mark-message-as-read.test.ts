import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for markMessageAsRead function.
 * Validates that the function sends the correct boolean value (not a number) to Microsoft Graph API.
 */
describe("markMessageAsRead - Microsoft Graph Integration", () => {
  let fetchSpy: any;

  beforeEach(() => {
    // Mock fetch to verify the request body
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send isRead: true (boolean) not isRead: 1 (number) to Graph API", async () => {
    // Mock the token response
    fetchSpy.mockImplementation((url: string, options: any) => {
      if (url.includes("oauth2/v2.0/token")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              expires_in: 3600,
            }),
            { status: 200 }
          )
        );
      }

      // Verify the PATCH request body contains isRead: true (not 1)
      if (url.includes("/messages/") && options.method === "PATCH") {
        const body = JSON.parse(options.body);
        expect(body.isRead).toBe(true);
        expect(typeof body.isRead).toBe("boolean");
        expect(body.isRead).not.toBe(1);

        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200 })
        );
      }

      return Promise.reject(new Error("Unexpected fetch call"));
    });

    // Import and call the function
    const { markMessageAsRead } = await import("./_core/email");
    const result = await markMessageAsRead("test-message-id");

    // Verify success
    expect(result).toBe(true);

    // Verify fetch was called with correct parameters
    expect(fetchSpy).toHaveBeenCalledTimes(2); // Once for token, once for PATCH
    const patchCall = fetchSpy.mock.calls[1];
    expect(patchCall[0]).toContain("/messages/test-message-id");
    expect(patchCall[1].method).toBe("PATCH");
  });

  it("should handle 401 token refresh and retry with correct body", async () => {
    let callCount = 0;

    fetchSpy.mockImplementation((url: string, options: any) => {
      if (url.includes("oauth2/v2.0/token")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token-" + ++callCount,
              expires_in: 3600,
            }),
            { status: 200 }
          )
        );
      }

      // First PATCH returns 401 (unauthorized)
      if (url.includes("/messages/") && options.method === "PATCH") {
        const body = JSON.parse(options.body);
        expect(body.isRead).toBe(true);
        expect(typeof body.isRead).toBe("boolean");

        if (callCount === 1) {
          return Promise.resolve(
            new Response(JSON.stringify({}), { status: 401 })
          );
        }

        // Second PATCH (after token refresh) succeeds
        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200 })
        );
      }

      return Promise.reject(new Error("Unexpected fetch call"));
    });

    const { markMessageAsRead } = await import("./_core/email");
    const result = await markMessageAsRead("test-message-id");

    // Verify success after retry
    expect(result).toBe(true);
  });

  it("should return false on persistent 400 error", async () => {
    fetchSpy.mockImplementation((url: string, options: any) => {
      if (url.includes("oauth2/v2.0/token")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              expires_in: 3600,
            }),
            { status: 200 }
          )
        );
      }

      if (url.includes("/messages/") && options.method === "PATCH") {
        // Simulate 400 Bad Request
        return Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                code: "ErrorInvalidRequest",
                message: "Invalid request",
              },
            }),
            { status: 400 }
          )
        );
      }

      return Promise.reject(new Error("Unexpected fetch call"));
    });

    const { markMessageAsRead } = await import("./_core/email");
    const result = await markMessageAsRead("test-message-id");

    // Verify failure
    expect(result).toBe(false);
  });
});
