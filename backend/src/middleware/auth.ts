import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.js";
import { HttpError, asyncHandler } from "../utils/http.js";
import { verifyAccessToken } from "../utils/tokens.js";

function readAccessToken(request: Request) {
  const cookieToken = request.cookies?.aimlearn_access as string | undefined;
  const authorization = request.header("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  return cookieToken ?? bearerToken;
}

export const authenticate = asyncHandler(async (request, _response, next) => {
  const token = readAccessToken(request);
  if (!token) {
    throw new HttpError(401, "Please sign in to continue.");
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new HttpError(401, "Your account could not be found.");
    }
    request.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
});

export function requireAdmin(request: Request, _response: Response, next: NextFunction) {
  if (request.user?.role !== "admin") {
    next(new HttpError(403, "Administrator access is required."));
    return;
  }
  next();
}
