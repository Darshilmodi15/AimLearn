import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { HttpError, asyncHandler } from "../utils/http.js";
import { serializeUser } from "../utils/serializers.js";
import { env } from "../config/env.js";
import {
  clearAuthCookies,
  hashToken,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/tokens.js";

const router = Router();

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

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

const googleSchema = z.object({
  credential: z.string()
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
    if (!user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "The email or password is incorrect.");
    }

    await issueSession(user, response);
    response.json({ user: serializeUser(user) });
  })
);

router.post(
  "/google",
  asyncHandler(async (request, response) => {
    if (!googleClient || !env.GOOGLE_CLIENT_ID) {
      throw new HttpError(501, "Google authentication is not configured.");
    }

    const { credential } = googleSchema.parse(request.body);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID
    });

    const tokenPayload = ticket.getPayload();
    if (!tokenPayload || !tokenPayload.email) {
      throw new HttpError(400, "Invalid Google token.");
    }

    const { email, name, sub: googleId, picture } = tokenPayload;

    let user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { googleId }]
    }).select("+refreshTokenHash");

    let isNewUser = false;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.avatarUrl) {
        user.avatarUrl = picture;
      }
    } else {
      isNewUser = true;
      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        googleId,
        avatarUrl: picture,
        role: "user"
      });
    }

    await issueSession(user, response);
    response.status(isNewUser ? 201 : 200).json({ user: serializeUser(user) });
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

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  avatarUrl: z.union([z.string().url(), z.literal("")]).optional(),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/\d/, "Password must contain a number.")
    .optional()
});

router.put(
  "/profile",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = profileSchema.parse(request.body);
    const user = request.user!;

    if (input.name) user.name = input.name;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl || undefined;

    if (input.email && input.email !== user.email) {
      const emailExists = await User.exists({ email: input.email, _id: { $ne: user._id } });
      if (emailExists) {
        throw new HttpError(409, "An account already exists for that email.");
      }
      user.email = input.email;
    }

    if (input.password) {
      user.passwordHash = await bcrypt.hash(input.password, 12);
    }

    await user.save();
    response.json({ user: serializeUser(user) });
  })
);

export default router;
