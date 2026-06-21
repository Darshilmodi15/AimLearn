import { Router } from "express";
import { isValidObjectId } from "mongoose";
import sanitizeHtml from "sanitize-html";
import slugify from "slugify";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Review } from "../models/Review.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();

const lessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  contentHtml: z.string().min(1),
  videoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(600).default(10),
  order: z.coerce.number().int().min(1),
  preview: z.boolean().default(false)
});

const courseSchema = z.object({
  title: z.string().trim().min(3).max(140),
  shortDescription: z.string().trim().min(20).max(220),
  description: z.string().trim().min(40).max(6000),
  price: z.coerce.number().min(0).max(100000),
  category: z.string().trim().min(2).max(80),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  thumbnailUrl: z.union([z.string().url(), z.literal("")]).optional(),
  instructor: z.object({
    name: z.string().trim().min(2).max(100),
    title: z.string().trim().min(2).max(140),
    bio: z.string().trim().min(10).max(1200),
    avatarUrl: z.union([z.string().url(), z.literal("")]).optional()
  }),
  lessons: z.array(lessonSchema).min(1),
  featured: z.boolean().default(false),
  published: z.boolean().default(true)
});

function sanitizeCourse(input: z.infer<typeof courseSchema>) {
  return {
    ...input,
    description: sanitizeHtml(input.description, { allowedTags: [] }),
    lessons: input.lessons.map((lesson) => ({
      ...lesson,
      contentHtml: sanitizeHtml(lesson.contentHtml, {
        allowedTags: ["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "code", "pre", "blockquote", "a"],
        allowedAttributes: { a: ["href", "target", "rel"] },
        allowedSchemes: ["http", "https", "mailto"]
      }),
      videoUrl: lesson.videoUrl || undefined
    })),
    thumbnailUrl: input.thumbnailUrl || undefined,
    instructor: {
      ...input.instructor,
      avatarUrl: input.instructor.avatarUrl || undefined
    }
  };
}

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = z
      .object({
        category: z.string().optional(),
        difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
        price: z.enum(["free", "paid"]).optional(),
        search: z.string().trim().optional(),
        featured: z.enum(["true", "false"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12)
      })
      .parse(request.query);

    const filter: Record<string, unknown> = { published: true };
    if (query.category) filter.category = query.category;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.price === "free") filter.price = 0;
    if (query.price === "paid") filter.price = { $gt: 0 };
    if (query.featured) filter.featured = query.featured === "true";
    if (query.search) filter.$text = { $search: query.search };

    const skip = (query.page - 1) * query.limit;
    const [courses, total, categories] = await Promise.all([
      Course.find(filter).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      Course.countDocuments(filter),
      Course.distinct("category", { published: true })
    ]);

    response.json({
      courses,
      categories: categories.sort(),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.max(1, Math.ceil(total / query.limit))
      }
    });
  })
);

router.get(
  "/:identifier",
  asyncHandler(async (request, response) => {
    const identifier = request.params.identifier;
    const filter = isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
    const course = await Course.findOne({ ...filter, published: true }).lean();
    if (!course) throw new HttpError(404, "Course not found.");

    const [reviews, rating] = await Promise.all([
      Review.find({ courseId: course._id })
        .populate("userId", "name avatarUrl")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Review.aggregate<{ average: number; count: number }>([
        { $match: { courseId: course._id } },
        { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
      ])
    ]);

    response.json({
      course,
      reviews,
      rating: rating[0] ?? { average: 0, count: 0 }
    });
  })
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  asyncHandler(async (request, response) => {
    const input = sanitizeCourse(courseSchema.parse(request.body));
    const baseSlug = slugify(input.title, { lower: true, strict: true });
    const slugExists = await Course.exists({ slug: baseSlug });
    const course = await Course.create({
      ...input,
      slug: slugExists ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug
    });
    response.status(201).json({ course });
  })
);

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  asyncHandler(async (request, response) => {
    const input = sanitizeCourse(courseSchema.parse(request.body));
    const course = await Course.findByIdAndUpdate(request.params.id, input, {
      new: true,
      runValidators: true
    });
    if (!course) throw new HttpError(404, "Course not found.");
    response.json({ course });
  })
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  asyncHandler(async (request, response) => {
    const course = await Course.findByIdAndDelete(request.params.id);
    if (!course) throw new HttpError(404, "Course not found.");
    await Promise.all([
      Enrollment.deleteMany({ courseId: course._id }),
      Review.deleteMany({ courseId: course._id })
    ]);
    response.status(204).send();
  })
);

export default router;
