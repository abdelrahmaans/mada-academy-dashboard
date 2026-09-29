import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";
import type { AuthPrincipal } from "./types";

type TokenPayload = AuthPrincipal & { iat: number; exp: number };
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = <T>(value: string) => JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
const sign = (body: string) => createHmac("sha256", env.JWT_SECRET).update(body).digest("base64url");

export function issueAccessToken(principal: Omit<AuthPrincipal, "sessionId"> & { sessionId?: string }) {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = { ...principal, sessionId: principal.sessionId ?? randomUUID(), iat: now, exp: now + env.ACCESS_TOKEN_TTL_SECONDS };
  const body = encode({ alg: "HS256", typ: "JWT" }) + "." + encode(payload);
  return `${body}.${sign(body)}`;
}

export function verifyAccessToken(token: string): AuthPrincipal {
  const [header, encoded, signature] = token.split(".");
  if (!header || !encoded || !signature) throw new Error("MALFORMED_TOKEN");
  const expected = sign(`${header}.${encoded}`);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("INVALID_TOKEN");
  const payload = decode<TokenPayload>(encoded);
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error("TOKEN_EXPIRED");
  return payload;
}
