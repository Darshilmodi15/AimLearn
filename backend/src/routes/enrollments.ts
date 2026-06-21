import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const { courseId } = z.object({ courseId: z.string().min(1) }).parse(request.body);
    const course = await Course.findById(courseId);
    if (!course || !course.published) throw new HttpError(404, "Course not found.");
    if (course.price > 0) {
      throw new HttpError(402, "This course requires payment before enrollment.");
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { userId: request.user!._id, courseId },
      { $setOnInsert: { enrolledAt: new Date(), completedLessons: [] } },
      { upsert: true, new: true }
    );
    response.status(201).json({ enrollment });
  })
);

router.get(
  "/me",
  asyncHandler(async (request, response) => {
    const enrollments = await Enrollment.find({ userId: request.user!._id })
      .populate("courseId")
      .sort({ updatedAt: -1 })
      .lean();

    const normalized = enrollments.map((enrollment) => {
      const course = enrollment.courseId as any;
      const lessonCount = course?.lessons?.length ?? 0;
      return {
        ...enrollment,
        progressPercent:
          lessonCount === 0 ? 0 : Math.round((enrollment.completedLessons.length / lessonCount) * 100)
      };
    });
    response.json({ enrollments: normalized });
  })
);

router.put(
  "/:id/progress",
  asyncHandler(async (request, response) => {
    const input = z
      .object({
        lessonId: z.string().min(1),
        completed: z.boolean()
      })
      .parse(request.body);

    const enrollment = await Enrollment.findOne({
      _id: request.params.id,
      userId: request.user!._id
    }).populate("courseId");
    if (!enrollment) throw new HttpError(404, "Enrollment not found.");

    const course = enrollment.courseId as any;
    const lessonExists = course.lessons.some((lesson: { _id: unknown }) => String(lesson._id) === input.lessonId);
    if (!lessonExists) throw new HttpError(400, "That lesson does not belong to this course.");

    const completed = new Set(enrollment.completedLessons.map(String));
    if (input.completed) completed.add(input.lessonId);
    else completed.delete(input.lessonId);

    enrollment.completedLessons = [...completed] as any;
    enrollment.lastLessonId = input.lessonId as any;
    await enrollment.save();

    response.json({
      enrollment,
      progressPercent: Math.round((completed.size / Math.max(1, course.lessons.length)) * 100)
    });
  })
);

export default router;
