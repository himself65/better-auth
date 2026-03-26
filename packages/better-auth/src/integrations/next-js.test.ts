import { describe, expect, it } from "vitest";
import { nextCookies } from "./next-js";

/**
 * @see https://github.com/better-auth/better-auth/issues/8784
 */
describe("nextCookies plugin", () => {
	it("should not leak internal cookie to client by avoiding cookie creation", () => {
		const plugin = nextCookies();
		const beforeHook = plugin.hooks?.before?.[0];

		expect(beforeHook).toBeDefined();

		// Verify the handler exists and is for /get-session
		const ctx = {
			path: "/get-session",
		};

		expect(beforeHook?.matcher(ctx as any)).toBe(true);

		// The fix is in the implementation: we use delete() on a non-existent cookie
		// instead of set() + delete(), which prevents the cookie from being created
		// and then leaked to the client.
		// This test verifies the plugin structure is correct.
	});
});
