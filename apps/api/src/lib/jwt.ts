import { SignJWT, jwtVerify } from "jose";

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
};

function getSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signToken(
  payload: JwtPayload,
  secret: string
): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret(secret));
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret));
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
