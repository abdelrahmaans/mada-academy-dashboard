import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../http/errors";
import { verifyAccessToken } from "./token";
import type { AuthPrincipal } from "./types";

declare global { namespace Express { interface Request { principal?: AuthPrincipal; requestId?: string; } } }

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const value = req.header("authorization");
  if (!value?.startsWith("Bearer ")) return next(unauthorized());
  try { req.principal = verifyAccessToken(value.slice(7)); next(); }
  catch { next(unauthorized("Invalid or expired access token")); }
}
