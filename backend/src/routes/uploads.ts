import { createHash } from "node:crypto";
import { Router } from "express";
import { env } from "../config/env.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();

router.get(
  "/signature",
  authenticate,
  requireAdmin,
  asyncHandler(async (_request, response) => {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new HttpError(503, "Cloudinary is not configured yet. Add its credentials to backend/.env.");
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "aimlearn/courses";
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
      .digest("hex");

    response.json({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature
    });
  })
);

export default router;
