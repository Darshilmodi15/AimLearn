import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/http.js";
import { serializeUser } from "../utils/serializers.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get(
  "/courses",
  asyncHandler(async (_request, response) => {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    response.json({ courses });
  })
);

router.get(
  "/users",
  asyncHandler(async (_request, response) => {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const enrollmentCounts = await Enrollment.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]);
    const counts = new Map(enrollmentCounts.map((item) => [String(item._id), item.count]));
    response.json({
      users: users.map((user) => ({
        ...serializeUser(user as any),
        enrollmentCount: counts.get(String(user._id)) ?? 0
      }))
    });
  })
);

router.get(
  "/reports",
  asyncHandler(async (_request, response) => {
    const [users, courses, enrollments, completedLessons, popularCourses, recentEnrollments] =
      await Promise.all([
        User.countDocuments(),
        Course.countDocuments({ published: true }),
        Enrollment.countDocuments(),
        Enrollment.aggregate<{ total: number }>([
          { $project: { count: { $size: "$completedLessons" } } },
          { $group: { _id: null, total: { $sum: "$count" } } }
        ]),
        Enrollment.aggregate([
          { $group: { _id: "$courseId", enrollments: { $sum: 1 } } },
          { $sort: { enrollments: -1 } },
          { $limit: 5 },
          { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "course" } },
          { $unwind: "$course" },
          { $project: { _id: 0, courseId: "$_id", title: "$course.title", enrollments: 1 } }
        ]),
        Enrollment.find()
          .populate("userId", "name email")
          .populate("courseId", "title")
          .sort({ enrolledAt: -1 })
          .limit(8)
          .lean()
      ]);

    response.json({
      metrics: {
        users,
        courses,
        enrollments,
        lessonsCompleted: completedLessons[0]?.total ?? 0
      },
      popularCourses,
      recentEnrollments
    });
  })
);

export default router;
