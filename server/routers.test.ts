import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("appRouter", () => {
  describe("auth.me", () => {
    it("returns user when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeDefined();
      expect(result?.name).toBe("Test User");
      expect(result?.email).toBe("test@example.com");
    });

    it("returns null when not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });
  });

  describe("products router", () => {
    it("requires authentication for products.list", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.products.list({})).rejects.toThrow();
    });

    it("requires authentication for products.create", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.products.create({
          name: "Test Card",
          type: "card",
          quantity: 1,
          buyPrice: 1000,
        })
      ).rejects.toThrow();
    });
  });

  describe("sales router", () => {
    it("requires authentication for sales.list", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.sales.list({})).rejects.toThrow();
    });
  });

  describe("purchases router", () => {
    it("requires authentication for purchases.list", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.purchases.list({})).rejects.toThrow();
    });
  });

  describe("dashboard router", () => {
    it("requires authentication for dashboard.stats", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.dashboard.stats()).rejects.toThrow();
    });
  });

  describe("ai router", () => {
    it("requires authentication for ai.chat", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.ai.chat({ messages: [{ role: "user", content: "Tóm tắt kho của tôi" }] })).rejects.toThrow();
    });
  });

  describe("reports router", () => {
    it("requires authentication for reports.overview", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.reports.overview()).rejects.toThrow();
    });
  });

  describe("chyusen router", () => {
    it("requires authentication for chyusen.list", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.chyusen.list()).rejects.toThrow();
    });

    it("requires authentication for chyusen.create", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.chyusen.create({ title: "Test draw" })).rejects.toThrow();
    });
  });
});
