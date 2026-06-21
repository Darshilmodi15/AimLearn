import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Review } from "../models/Review.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();

router.post(
  "/:courseId",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = z
      .object({
        rating: z.coerce.number().int().min(1).max(5),
        comment: z.string().trim().min(10).max(800)
      })
      .parse(request.body);

    const [course, enrollment] = await Promise.all([
      Course.exists({ _id: request.params.courseId }),
      Enrollment.exists({ userId: request.user!._id, courseId: request.params.courseId })
    ]);
    if (!course) throw new HttpError(404, "Course not found.");
    if (!enrollment) throw new HttpError(403, "Enroll in the course before leaving a review.");

    const review = await Review.findOneAndUpdate(
      { userId: request.user!._id, courseId: request.params.courseId },
      input,
      { upsert: true, new: true, runValidators: true }
    ).populate("userId", "name avatarUrl");

    response.status(201).json({ review });
  })
);

export default router;
