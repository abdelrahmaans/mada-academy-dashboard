import express, { type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { env } from "./config/env";
import { apiV1 } from "./api/v1/routes";
import { requestContext } from "./http/request-context";
import { ApiError } from "./http/errors";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);
  app.get("/health", (_req, res) => res.json({ ok: true, service: "mada-academy" }));
  app.use(env.API_PREFIX, apiV1);
  app.use((req, res, next) => {
    if (req.path.startsWith(env.API_PREFIX)) return next(new ApiError(404, "NOT_FOUND", "API route not found"));
    res.status(404).send("Not found");
  });
  const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    const apiError = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "Unexpected server error");
    if (apiError.status >= 500) console.error({ requestId: req.requestId ?? randomUUID(), error });
    res.status(apiError.status).json({ error: { code: apiError.code, message: apiError.message, details: apiError.details, requestId: req.requestId } });
  };
  app.use(errorHandler);
  return app;
}
