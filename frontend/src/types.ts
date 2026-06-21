export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
  createdAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  contentHtml: string;
  videoUrl?: string;
  durationMinutes: number;
  order: number;
  preview: boolean;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  difficulty: Difficulty;
  thumbnailUrl?: string;
  instructor: {
    name: string;
    title: string;
    bio: string;
    avatarUrl?: string;
  };
  lessons: Lesson[];
  featured: boolean;
  published: boolean;
  createdAt?: string;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  userId: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export interface Enrollment {
  _id: string;
  courseId: Course;
  completedLessons: string[];
  lastLessonId?: string;
  enrolledAt: string;
  progressPercent: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminUser extends User {
  enrollmentCount: number;
}

export interface AdminReport {
  metrics: {
    users: number;
    courses: number;
    enrollments: number;
    lessonsCompleted: number;
  };
  popularCourses: Array<{ courseId: string; title: string; enrollments: number }>;
  recentEnrollments: Array<{
    _id: string;
    enrolledAt: string;
    userId: { name: string; email: string };
    courseId: { title: string };
  }>;
}
