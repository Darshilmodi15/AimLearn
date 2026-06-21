import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { HttpError, asyncHandler } from "../utils/http.js";
import { serializeUser } from "../utils/serializers.js";
import {
  clearAuthCookies,
  hashToken,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/tokens.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/\d/, "Password must contain a number.")
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

async function issueSession(user: InstanceType<typeof User>, response: Parameters<typeof setAuthCookies>[0]) {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  setAuthCookies(response, accessToken, refreshToken);
}

router.post(
  "/signup",
  asyncHandler(async (request, response) => {
    const input = signupSchema.parse(request.body);
    const exists = await User.exists({ email: input.email });
    if (exists) throw new HttpError(409, "An account already exists for this email.");

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12)
    });
    await issueSession(user, response);
    response.status(201).json({ user: serializeUser(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body);
    const user = await User.findOne({ email: input.email }).select("+passwordHash +refreshTokenHash");
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "The email or password is incorrect.");
    }

    await issueSession(user, response);
    response.json({ user: serializeUser(user) });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (request, response) => {
    const refreshToken = request.cookies?.aimlearn_refresh as string | undefined;
    if (!refreshToken) throw new HttpError(401, "No refresh session was found.");

    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.sub).select("+refreshTokenHash");
      if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
        throw new HttpError(401, "This refresh session is no longer valid.");
      }
      await issueSession(user, response);
      response.json({ user: serializeUser(user) });
    } catch (error) {
      clearAuthCookies(response);
      if (error instanceof HttpError) throw error;
      throw new HttpError(401, "Your refresh session has expired.");
    }
  })
);

router.post(
  "/logout",
  asyncHandler(async (request, response) => {
    const refreshToken = request.cookies?.aimlearn_refresh as string | undefined;
    if (refreshToken) {
      const user = await User.findOne({ refreshTokenHash: hashToken(refreshToken) }).select("+refreshTokenHash");
      if (user) {
        user.refreshTokenHash = undefined;
        await user.save();
      }
    }
    clearAuthCookies(response);
    response.status(204).send();
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (request, response) => {
    response.json({ user: serializeUser(request.user!) });
  })
);

export default router;
