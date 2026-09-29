import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { env } from "./config/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = env.NODE_ENV === "production"
  ? path.resolve(__dirname, "public")
  : path.resolve(__dirname, "..", "dist", "public");

const app = createApp();
app.use(express.static(staticPath));
app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));

createServer(app).listen(env.PORT, () => {
  console.log(`Mada Academy API listening on http://localhost:${env.PORT}`);
});
