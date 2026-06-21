import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (request, response) => {
    const enrollments = await Enrollment.find({ userId: request.user!._id })
      .populate("courseId", "category")
      .lean();
    const enrolledIds = enrollments.map((item) => (item.courseId as any)._id);
    const categories = [...new Set(enrollments.map((item) => (item.courseId as any).category))];

    const categoryMatches = categories.length
      ? await Course.find({
          _id: { $nin: enrolledIds },
          category: { $in: categories },
          published: true
        })
          .limit(4)
          .lean()
      : [];

    const recommendations =
      categoryMatches.length > 0
        ? categoryMatches
        : await Course.find({ _id: { $nin: enrolledIds }, published: true })
            .sort({ featured: -1, createdAt: -1 })
            .limit(4)
            .lean();

    response.json({ recommendations });
  })
);

export default router;
