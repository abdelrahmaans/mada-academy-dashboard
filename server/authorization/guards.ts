import type { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../http/errors";
import type { StaffRole, ScopeLevel } from "../auth/types";

export function requireStaff(req: Request, _res: Response, next: NextFunction) {
  if (!req.principal) return next(unauthorized());
  if (req.principal.accountType !== "staff" || !req.principal.role) return next(forbidden("Staff account required"));
  next();
}

export function requireRoles(...roles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.principal) return next(unauthorized());
    if (!req.principal.role || !roles.includes(req.principal.role)) return next(forbidden("Role is not allowed for this operation"));
    next();
  };
}

export function requireScope(levels: ScopeLevel[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.principal) return next(unauthorized());
    if (!levels.includes(req.principal.scopeLevel)) return next(forbidden("Scope is not allowed for this operation"));
    next();
  };
}

export function requireTenantParam(param = "tenantId") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const principal = req.principal;
    const requested = req.params[param] ?? req.body?.[param] ?? req.query[param];
    if (!principal || principal.accountType !== "staff") return next(forbidden("Tenant-scoped staff account required"));
    if (principal.role !== "R00_PLATFORM_ADMIN" && requested && requested !== principal.tenantId) return next(forbidden("Cross-tenant access denied"));
    next();
  };
}
