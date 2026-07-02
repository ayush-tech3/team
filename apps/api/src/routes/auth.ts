import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/password";
import { signToken } from "../lib/jwt";
import type { Env } from "../types";

const auth = new Hono<{ Bindings: Env }>();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const db = createDb(c.env.DB);

  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    id,
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: new Date(),
  });

  const token = await signToken({ sub: id, email: email.toLowerCase(), name }, c.env.JWT_SECRET);

  return c.json({
    token,
    user: { id, email: email.toLowerCase(), name, createdAt: new Date().toISOString() },
  });
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = createDb(c.env.DB);

  const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await signToken(
    { sub: user.id, email: user.email, name: user.name },
    c.env.JWT_SECRET
  );

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: new Date(user.createdAt).toISOString(),
    },
  });
});

export default auth;
