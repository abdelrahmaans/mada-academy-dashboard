import { describe, expect, it } from "vitest";
import request from "supertest";
import { issueAccessToken, verifyAccessToken } from "../auth/token";
import { assertTransition, expenseTransitions } from "./state-machine";
import { createApp } from "../app";

describe("backend P0 foundation", () => {
  it("issues and verifies a scoped staff token", () => {
    const token = issueAccessToken({ sub: "u-1", accountType: "staff", role: "R02_BRANCH_MANAGER", tenantId: "t-1", branchId: "b-1", scopeLevel: "branch" });
    expect(verifyAccessToken(token)).toMatchObject({ sub: "u-1", role: "R02_BRANCH_MANAGER", tenantId: "t-1", branchId: "b-1" });
  });

  it("rejects an illegal state transition", () => {
    expect(() => assertTransition(expenseTransitions, "PENDING", "PAID")).toThrow("Transition PENDING -> PAID is not allowed");
    expect(() => assertTransition(expenseTransitions, "PENDING", "APPROVED")).not.toThrow();
  });

  it("protects the API and enforces tenant scope", async () => {
    const app = createApp();
    expect((await request(app).get("/api/v1/me")).status).toBe(401);
    const token = issueAccessToken({ sub: "u-1", accountType: "staff", role: "R01_ACADEMY_OWNER", tenantId: "t-1", scopeLevel: "tenant" });
    expect((await request(app).get("/api/v1/tenants/t-2/access-check").set("Authorization", `Bearer ${token}`)).status).toBe(403);
    expect((await request(app).get("/api/v1/tenants/t-1/access-check").set("Authorization", `Bearer ${token}`)).status).toBe(200);
  });
});
