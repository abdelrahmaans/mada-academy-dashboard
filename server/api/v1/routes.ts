import { Router } from "express";
import { requireAuth } from "../../auth/middleware";
import { requireRoles, requireStaff, requireTenantParam } from "../../authorization/guards";

export const apiV1 = Router();

apiV1.get("/health", (_req, res) => res.json({ ok: true, service: "mada-academy-api", version: "v1" }));

apiV1.get("/me", requireAuth, (req, res) => {
  res.json({ data: { principal: req.principal } });
});

apiV1.get(
  "/tenants/:tenantId/access-check",
  requireAuth,
  requireStaff,
  requireRoles("R00_PLATFORM_ADMIN", "R01_ACADEMY_OWNER"),
  requireTenantParam("tenantId"),
  (req, res) => res.json({ data: { allowed: true, tenantId: req.params.tenantId, principal: req.principal?.sub } }),
);
