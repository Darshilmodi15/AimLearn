import { Router, type Request } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, "Stripe is not configured yet. Add the test keys to backend/.env.");
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export const stripeWebhook = asyncHandler(async (request: Request, response) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new HttpError(503, "Stripe webhook verification is not configured.");
  }
  const signature = request.header("stripe-signature");
  if (!signature) throw new HttpError(400, "Missing Stripe signature.");

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(request.body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;
    const pricePaid = session.amount_total ? session.amount_total / 100 : 0;
    if (userId && courseId) {
      await Enrollment.findOneAndUpdate(
        { userId, courseId },
        { $setOnInsert: { enrolledAt: new Date(), completedLessons: [], pricePaid } },
        { upsert: true }
      );
    }
  }
  response.json({ received: true });
});

router.post(
  "/checkout",
  authenticate,
  asyncHandler(async (request, response) => {
    const { courseId } = z.object({ courseId: z.string().min(1) }).parse(request.body);
    const course = await Course.findById(courseId);
    if (!course || !course.published) throw new HttpError(404, "Course not found.");
    if (course.price <= 0) throw new HttpError(400, "This course can be enrolled in for free.");

    const existing = await Enrollment.exists({ userId: request.user!._id, courseId });
    if (existing) throw new HttpError(409, "You are already enrolled in this course.");

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: request.user!.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: env.STRIPE_CURRENCY,
            unit_amount: Math.round(course.price * 100),
            product_data: {
              name: course.title,
              description: course.shortDescription
            }
          }
        }
      ],
      metadata: { userId: request.user!.id, courseId: course.id },
      success_url: `${env.CLIENT_URL}/dashboard?payment=success`,
      cancel_url: `${env.CLIENT_URL}/courses/${course.slug}?payment=cancelled`
    });

    response.json({ url: session.url });
  })
);

export default router;
