import { describe, it, expect } from "vitest";

describe("Better-auth configuration", () => {
  it("auth instance has handler method", async () => {
    const { auth } = await import("@/lib/auth");
    expect(typeof auth.handler).toBe("function");
  });

  it("auth instance has api property", async () => {
    const { auth } = await import("@/lib/auth");
    expect(auth.api).toBeDefined();
    expect(typeof auth.api).toBe("object");
  });

  it("route handler exports GET and POST", async () => {
    const routeModule = await import("@/app/api/auth/[...all]/route");
    expect(typeof routeModule.GET).toBe("function");
    expect(typeof routeModule.POST).toBe("function");
  });
});
