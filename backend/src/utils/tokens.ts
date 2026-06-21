import { createHash } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env.js";

interface TokenPayload {
  sub: string;
  role: "user" | "admin";
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"]
  });
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const cookieBase = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/"
} as const;

export function setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
  response.cookie("aimlearn_access", accessToken, {
    ...cookieBase,
    maxAge: 15 * 60 * 1000
  });
  response.cookie("aimlearn_refresh", refreshToken, {
    ...cookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(response: Response) {
  response.clearCookie("aimlearn_access", cookieBase);
  response.clearCookie("aimlearn_refresh", cookieBase);
}
