import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Menu,
  PlayCircle,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Spinner } from "../components/Spinner";
import { apiFetch, getErrorMessage } from "../lib/api";
import type { Course, Enrollment, Lesson, Review } from "../types";

export function LearnPage() {
  const { slug } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      apiFetch<{ course: Course; reviews: Review[] }>(`/courses/${slug}`),
      apiFetch<{ enrollments: Enrollment[] }>("/enrollments/me")
    ])
      .then(([courseResponse, enrollmentResponse]) => {
        const match = enrollmentResponse.enrollments.find((item) => item.courseId._id === courseResponse.course._id);
        if (!match) throw new Error("Enroll in this course before opening its lessons.");
        const sortedLessons = courseResponse.course.lessons.toSorted((a, b) => a.order - b.order);
        const initial =
          sortedLessons.find((item) => item._id === match.lastLessonId) ??
          sortedLessons.find((item) => !match.completedLessons.includes(item._id)) ??
          sortedLessons[0];
        setCourse(courseResponse.course);
        setEnrollment(match);
        setLesson(initial ?? null);
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [slug]);

  const sortedLessons = useMemo(
    () => course?.lessons.toSorted((a, b) => a.order - b.order) ?? [],
    [course]
  );
  const currentIndex = lesson ? sortedLessons.findIndex((item) => item._id === lesson._id) : -1;

  const selectLesson = (nextLesson: Lesson) => {
    setLesson(nextLesson);
    setAnswer("");
    setAnswerChecked(false);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCompleted = async () => {
    if (!enrollment || !lesson) return;
    const currentlyCompleted = enrollment.completedLessons.includes(lesson._id);
    setSaving(true);
    try {
      const response = await apiFetch<{ enrollment: Enrollment; progressPercent: number }>(
        `/enrollments/${enrollment._id}/progress`,
        {
          method: "PUT",
          body: JSON.stringify({ lessonId: lesson._id, completed: !currentlyCompleted })
        }
      );
      setEnrollment((current) =>
        current
          ? {
              ...current,
              completedLessons: response.enrollment.completedLessons,
              lastLessonId: lesson._id,
              progressPercent: response.progressPercent
            }
          : current
      );
      if (!currentlyCompleted && sortedLessons[currentIndex + 1]) selectLesson(sortedLessons[currentIndex + 1]);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Preparing your lesson" />;
  if (!course || !enrollment || !lesson) {
    return (
      <div className="container state-card page-state">
        <h1>Lesson unavailable</h1>
        <p>{error || "This lesson could not be opened."}</p>
        <Link className="button button-primary" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const completed = enrollment.completedLessons.includes(lesson._id);
  return (
    <div className="learn-layout">
      <button
        className="lesson-menu-button"
        type="button"
        onClick={() => setSidebarOpen((current) => !current)}
        aria-label="Toggle course lessons"
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>
      <aside className={`lesson-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <Link className="back-link" to="/dashboard">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="sidebar-course-title">
          <span>{course.category}</span>
          <h2>{course.title}</h2>
          <div className="progress-track">
            <span style={{ width: `${enrollment.progressPercent}%` }} />
          </div>
          <small>{enrollment.progressPercent}% complete</small>
        </div>
        <nav className="lesson-nav" aria-label="Course lessons">
          {sortedLessons.map((item, index) => {
            const isComplete = enrollment.completedLessons.includes(item._id);
            return (
              <button
                className={item._id === lesson._id ? "active" : undefined}
                type="button"
                onClick={() => selectLesson(item)}
                key={item._id}
              >
                {isComplete ? <CheckCircle2 className="completed-icon" /> : <Circle />}
                <span>
                  <small>Lesson {index + 1}</small>
                  <strong>{item.title}</strong>
                  <em>
                    <Clock3 size={12} /> {item.durationMinutes} min
                  </em>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="lesson-workspace">
        <div className="lesson-topbar">
          <span>
            Lesson {currentIndex + 1} of {sortedLessons.length}
          </span>
          <div>
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => selectLesson(sortedLessons[currentIndex - 1])}
              aria-label="Previous lesson"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              disabled={currentIndex >= sortedLessons.length - 1}
              onClick={() => selectLesson(sortedLessons[currentIndex + 1])}
              aria-label="Next lesson"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        <article className="lesson-content">
          <span className="eyebrow">{course.category}</span>
          <h1>{lesson.title}</h1>
          <div className="lesson-byline">
            <PlayCircle size={17} /> {lesson.durationMinutes} minute lesson
          </div>
          {lesson.videoUrl ? (
            <div className="video-frame">
              <iframe
                src={lesson.videoUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="lesson-cover">
              <span>
                <PlayCircle />
              </span>
              <p>Read the lesson below, then complete the knowledge check.</p>
            </div>
          )}
          <div
            className="lesson-rich-text"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.contentHtml) }}
          />

          <section className="knowledge-check">
            <span className="eyebrow">Knowledge check</span>
            <h2>{lesson.quiz?.question ?? "What is the strongest way to make this lesson useful?"}</h2>
            <p>Choose the best response before moving on.</p>
            <div className="quiz-options">
              {(lesson.quiz?.options ?? [
                "Save it and revisit it eventually",
                "Apply one idea to a real situation this week",
                "Move quickly to the next lesson"
              ]).map((option, index) => (
                <label className={answer === option ? "selected" : ""} key={option}>
                  <input
                    type="radio"
                    name="knowledge-check"
                    value={option}
                    checked={answer === option}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setAnswerChecked(false);
                    }}
                  />
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option}
                </label>
              ))}
            </div>
            {answerChecked ? (
              <div
                className={
                  (lesson.quiz
                    ? lesson.quiz.options.indexOf(answer) === lesson.quiz.correctAnswerIndex
                    : answer.includes("Apply one idea"))
                    ? "quiz-feedback correct"
                    : "quiz-feedback incorrect"
                }
              >
                {(lesson.quiz
                  ? lesson.quiz.options.indexOf(answer) === lesson.quiz.correctAnswerIndex
                  : answer.includes("Apply one idea")) ? (
                  <>
                    <Check size={17} /> Correct. You've understood the key takeaway of this lesson.
                  </>
                ) : (
                  "Try again. Choose the option that best matches the lesson content."
                )}
              </div>
            ) : null}
            <button
              className="button button-secondary"
              type="button"
              disabled={!answer}
              onClick={() => setAnswerChecked(true)}
            >
              Check answer
            </button>
          </section>

          {error ? <div className="form-error">{error}</div> : null}
          <div className="lesson-actions">
            <button
              className={`button ${completed ? "button-secondary" : "button-primary"}`}
              type="button"
              onClick={toggleCompleted}
              disabled={saving}
            >
              {completed ? (
                <>
                  <CheckCircle2 size={18} /> Mark incomplete
                </>
              ) : (
                <>
                  Complete lesson <ArrowRight size={18} />
                </>
              )}
            </button>
            {currentIndex < sortedLessons.length - 1 ? (
              <button className="text-link" type="button" onClick={() => selectLesson(sortedLessons[currentIndex + 1])}>
                Next lesson <ArrowRight size={16} />
              </button>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
