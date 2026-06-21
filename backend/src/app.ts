import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { HttpError } from "./utils/http.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import enrollmentRoutes from "./routes/enrollments.js";
import paymentRoutes, { stripeWebhook } from "./routes/payments.js";
import recommendationRoutes from "./routes/recommendations.js";
import reviewRoutes from "./routes/reviews.js";
import uploadRoutes from "./routes/uploads.js";

export const app = express();
const allowedOrigins = new Set(env.CLIENT_URL.split(",").map((origin) => origin.trim()));

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: [...allowedOrigins],
    credentials: true
  })
);
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use((request, _response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }
  const origin = request.header("origin");
  if (origin && !allowedOrigins.has(origin)) {
    next(new HttpError(403, "This request origin is not allowed."));
    return;
  }
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === "test" ? 1000 : 80,
    standardHeaders: "draft-8",
    legacyHeaders: false
  })
);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "aimlearn-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/enroll", enrollmentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);
