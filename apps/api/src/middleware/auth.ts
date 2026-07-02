import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/jwt";
import type { Env } from "../types";

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: { userId: string; email: string; name: string } }>(
  async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = header.slice(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    c.set("userId", payload.sub);
    c.set("email", payload.email);
    c.set("name", payload.name);
    await next();
  }
);
