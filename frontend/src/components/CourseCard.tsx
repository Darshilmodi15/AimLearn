import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDuration } from "../lib/format";
import type { Course } from "../types";

const categoryGlyphs: Record<string, string> = {
  Design: "Aa",
  Product: "↗",
  Data: "∿",
  Development: "</>",
  Business: "◎",
  Marketing: "✦"
};

export function CourseCard({
  course,
  progress,
  dashboard = false
}: {
  course: Course;
  progress?: number;
  dashboard?: boolean;
}) {
  const minutes = course.lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0);

  return (
    <article className={`course-card ${dashboard ? "course-card-dashboard" : ""}`}>
      <Link className="course-visual" to={`/courses/${course.slug}`} aria-label={`View ${course.title}`}>
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" />
        ) : (
          <>
            <span className="course-visual-orbit" />
            <span className="course-glyph">{categoryGlyphs[course.category] ?? "A"}</span>
          </>
        )}
        <span className="course-category">{course.category}</span>
      </Link>
      <div className="course-card-body">
        <div className="course-meta">
          <span>{course.difficulty}</span>
          <span aria-hidden="true">•</span>
          <span>{formatCurrency(course.price)}</span>
        </div>
        <h3>
          <Link to={`/courses/${course.slug}`}>{course.title}</Link>
        </h3>
        <p>{course.shortDescription}</p>
        {progress === undefined ? (
          <div className="course-card-footer">
            <span>
              <BookOpen size={15} /> {course.lessons.length} lessons
            </span>
            <span>
              <Clock3 size={15} /> {formatDuration(minutes)}
            </span>
            <Link className="icon-link" to={`/courses/${course.slug}`} aria-label={`Open ${course.title}`}>
              <ArrowUpRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="course-progress">
            <div className="progress-label">
              <span>{progress}% complete</span>
              <Link to={`/learn/${course.slug}`}>{progress ? "Continue" : "Start course"}</Link>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
