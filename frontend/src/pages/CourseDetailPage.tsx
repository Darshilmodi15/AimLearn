import {
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  LockKeyhole,
  PlayCircle,
  Star,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { apiFetch, getErrorMessage } from "../lib/api";
import { formatCurrency, formatDuration } from "../lib/format";
import type { Course, Enrollment, Review } from "../types";

interface CourseResponse {
  course: Course;
  reviews: Review[];
  rating: { average: number; count: number };
}

export function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<CourseResponse | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(
    new URLSearchParams(location.search).get("payment") === "cancelled"
      ? "Payment was cancelled. You have not been charged."
      : ""
  );
  const [reviewInput, setReviewInput] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    if (!slug) return;
    const requests: [Promise<CourseResponse>, Promise<{ enrollments: Enrollment[] }> | Promise<null>] = [
      apiFetch<CourseResponse>(`/courses/${slug}`),
      user ? apiFetch<{ enrollments: Enrollment[] }>("/enrollments/me") : Promise.resolve(null)
    ];
    Promise.all(requests)
      .then(([courseResponse, enrollmentResponse]) => {
        setData(courseResponse);
        const match = enrollmentResponse?.enrollments.find((item) => item.courseId._id === courseResponse.course._id);
        setEnrollment(match ?? null);
      })
      .catch((error) => setMessage(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [slug, user]);

  const totalMinutes = useMemo(
    () => data?.course.lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0) ?? 0,
    [data]
  );

  const handleEnroll = async () => {
    if (!data) return;
    if (!user) {
      navigate("/login", { state: { from: `/courses/${data.course.slug}` } });
      return;
    }
    setActionLoading(true);
    setMessage("");
    try {
      if (data.course.price > 0) {
        const response = await apiFetch<{ url: string }>("/payments/checkout", {
          method: "POST",
          body: JSON.stringify({ courseId: data.course._id })
        });
        window.location.assign(response.url);
      } else {
        const response = await apiFetch<{ enrollment: Enrollment }>("/enrollments", {
          method: "POST",
          body: JSON.stringify({ courseId: data.course._id })
        });
        setEnrollment({ ...response.enrollment, courseId: data.course, progressPercent: 0 });
        setMessage("You’re enrolled. Your first lesson is ready.");
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data) return;
    setActionLoading(true);
    try {
      const response = await apiFetch<{ review: Review }>(`/reviews/${data.course._id}`, {
        method: "POST",
        body: JSON.stringify(reviewInput)
      });
      setData((current) =>
        current
          ? {
              ...current,
              reviews: [response.review, ...current.reviews.filter((item) => item._id !== response.review._id)]
            }
          : current
      );
      setReviewInput({ rating: 5, comment: "" });
      setMessage("Your review has been published.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner label="Opening course" />;
  if (!data) {
    return (
      <div className="container state-card page-state">
        <h1>Course unavailable</h1>
        <p>{message || "This course could not be found."}</p>
        <Link className="button button-primary" to="/courses">
          Browse all courses
        </Link>
      </div>
    );
  }

  const { course, reviews, rating } = data;
  return (
    <div className="course-detail-page">
      <section className="course-detail-hero">
        <div className="container course-detail-grid">
          <div>
            <div className="breadcrumbs">
              <Link to="/courses">Courses</Link>
              <span>/</span>
              <span>{course.category}</span>
            </div>
            <span className="eyebrow">{course.category}</span>
            <h1>{course.title}</h1>
            <p className="course-lead">{course.shortDescription}</p>
            <div className="course-detail-meta">
              <span>
                <Star size={17} fill="currentColor" /> {rating.average ? rating.average.toFixed(1) : "New"}{" "}
                <small>({rating.count} reviews)</small>
              </span>
              <span>
                <Users size={17} /> Learn at your pace
              </span>
              <span>
                <Globe2 size={17} /> English
              </span>
            </div>
            <div className="instructor-inline">
              <Avatar name={course.instructor.name} src={course.instructor.avatarUrl} />
              <p>
                Taught by <strong>{course.instructor.name}</strong>
                <span>{course.instructor.title}</span>
              </p>
            </div>
          </div>
          <aside className="enrollment-card">
            <div className="enrollment-visual">
              <span className="course-glyph">A</span>
              <span className="preview-pill">
                <PlayCircle size={16} /> Course preview
              </span>
            </div>
            <div className="enrollment-body">
              <strong className="course-price">{formatCurrency(course.price)}</strong>
              {message ? <div className="inline-alert">{message}</div> : null}
              {enrollment ? (
                <Link className="button button-primary button-full" to={`/learn/${course.slug}`}>
                  {enrollment.progressPercent ? "Continue learning" : "Start course"}
                </Link>
              ) : (
                <button
                  className="button button-primary button-full"
                  type="button"
                  onClick={handleEnroll}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Preparing…" : course.price ? "Enroll now" : "Enroll for free"}
                </button>
              )}
              <p className="secure-note">
                <LockKeyhole size={14} /> Secure enrollment. Learn at your own pace.
              </p>
              <h3>This course includes</h3>
              <ul className="feature-list">
                <li>
                  <BookOpen size={17} /> {course.lessons.length} focused lessons
                </li>
                <li>
                  <Clock3 size={17} /> {formatDuration(totalMinutes)} of learning
                </li>
                <li>
                  <BadgeCheck size={17} /> Progress tracking
                </li>
                <li>
                  <Globe2 size={17} /> Full lifetime access
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="container course-content-grid">
        <div className="course-main-content">
          <article className="content-section">
            <h2>About this course</h2>
            <p>{course.description}</p>
          </article>
          <article className="content-section">
            <h2>What you’ll learn</h2>
            <div className="outcome-grid">
              {[
                "Build a repeatable process you can use at work",
                "Make stronger decisions with practical frameworks",
                "Apply each concept through focused exercises",
                "Finish with a clear plan for continued practice"
              ].map((outcome) => (
                <p key={outcome}>
                  <span>
                    <Check size={15} />
                  </span>
                  {outcome}
                </p>
              ))}
            </div>
          </article>
          <article className="content-section">
            <div className="content-title-row">
              <div>
                <h2>Course syllabus</h2>
                <p>
                  {course.lessons.length} lessons • {formatDuration(totalMinutes)}
                </p>
              </div>
            </div>
            <div className="syllabus-list">
              {course.lessons
                .toSorted((a, b) => a.order - b.order)
                .map((lesson, index) => (
                  <details key={lesson._id} open={index === 0}>
                    <summary>
                      <span className="lesson-number">{String(index + 1).padStart(2, "0")}</span>
                      <span>
                        <strong>{lesson.title}</strong>
                        <small>{lesson.durationMinutes} min</small>
                      </span>
                      {lesson.preview ? <em>Preview</em> : <LockKeyhole size={15} />}
                      <ChevronDown className="details-chevron" size={18} />
                    </summary>
                    <p>Enroll to access the lesson materials, examples and guided exercise.</p>
                  </details>
                ))}
            </div>
          </article>
          <article className="content-section instructor-section">
            <h2>Your instructor</h2>
            <div>
              <Avatar name={course.instructor.name} src={course.instructor.avatarUrl} size="large" />
              <div>
                <h3>{course.instructor.name}</h3>
                <span>{course.instructor.title}</span>
                <p>{course.instructor.bio}</p>
              </div>
            </div>
          </article>
          <article className="content-section reviews-section">
            <h2>Learner reviews</h2>
            {enrollment ? (
              <form className="review-form" onSubmit={submitReview}>
                <label>
                  Rating
                  <select
                    value={reviewInput.rating}
                    onChange={(event) =>
                      setReviewInput((current) => ({ ...current, rating: Number(event.target.value) }))
                    }
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option value={value} key={value}>
                        {value} stars
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Share your experience
                  <textarea
                    value={reviewInput.comment}
                    onChange={(event) =>
                      setReviewInput((current) => ({ ...current, comment: event.target.value }))
                    }
                    minLength={10}
                    required
                  />
                </label>
                <button className="button button-secondary" type="submit" disabled={actionLoading}>
                  Publish review
                </button>
              </form>
            ) : null}
            <div className="review-list">
              {reviews.length ? (
                reviews.map((review) => (
                  <div className="review-card" key={review._id}>
                    <Avatar name={review.userId.name} src={review.userId.avatarUrl} size="small" />
                    <div>
                      <div className="review-heading">
                        <strong>{review.userId.name}</strong>
                        <span>{"★".repeat(review.rating)}</span>
                      </div>
                      <p>{review.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted-copy">No reviews yet. Enrolled learners can be the first to share their experience.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
