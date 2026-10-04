import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(_req: Request): CookieOptions {
  const isHttps = _req.secure || _req.headers["x-forwarded-proto"] === "https";
  return { httpOnly: true, path: "/", sameSite: isHttps ? "none" : "lax", secure: isHttps };
}
