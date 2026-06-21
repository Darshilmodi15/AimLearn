import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Spinner } from "../components/Spinner";
import { apiFetch, getErrorMessage } from "../lib/api";
import { formatCurrency } from "../lib/format";
import type { AdminReport, AdminUser, Course, Difficulty, Lesson } from "../types";

type AdminTab = "overview" | "courses" | "users";

interface CourseFormState {
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  difficulty: Difficulty;
  thumbnailUrl: string;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  featured: boolean;
  published: boolean;
  lessons: Array<Omit<Lesson, "_id"> & { _id?: string }>;
}

const emptyCourse: CourseFormState = {
  title: "",
  shortDescription: "",
  description: "",
  price: 0,
  category: "Development",
  difficulty: "Beginner",
  thumbnailUrl: "",
  instructorName: "",
  instructorTitle: "",
  instructorBio: "",
  featured: false,
  published: true,
  lessons: [
    {
      title: "",
      contentHtml: "<p>Add the lesson content here.</p>",
      videoUrl: "",
      durationMinutes: 10,
      order: 1,
      preview: true
    }
  ]
};

function toForm(course: Course): CourseFormState {
  return {
    title: course.title,
    shortDescription: course.shortDescription,
    description: course.description,
    price: course.price,
    category: course.category,
    difficulty: course.difficulty,
    thumbnailUrl: course.thumbnailUrl ?? "",
    instructorName: course.instructor.name,
    instructorTitle: course.instructor.title,
    instructorBio: course.instructor.bio,
    featured: course.featured,
    published: course.published,
    lessons: course.lessons
  };
}

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [report, setReport] = useState<AdminReport | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseFormState>(emptyCourse);
  const [saving, setSaving] = useState(false);

  const loadAdmin = () => {
    setLoading(true);
    Promise.all([
      apiFetch<AdminReport>("/admin/reports"),
      apiFetch<{ courses: Course[] }>("/admin/courses"),
      apiFetch<{ users: AdminUser[] }>("/admin/users")
    ])
      .then(([reportResponse, courseResponse, userResponse]) => {
        setReport(reportResponse);
        setCourses(courseResponse.courses);
        setUsers(userResponse.users);
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false));
  };

  useEffect(loadAdmin, []);

  const filteredCourses = useMemo(
    () => courses.filter((course) => course.title.toLowerCase().includes(search.toLowerCase())),
    [courses, search]
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  const openEditor = (course?: Course) => {
    setEditingId(course?._id ?? null);
    setForm(course ? toForm(course) : emptyCourse);
    setEditorOpen(true);
    setError("");
  };

  const updateLesson = (index: number, field: string, value: string | number | boolean) => {
    setForm((current) => ({
      ...current,
      lessons: current.lessons.map((lesson, lessonIndex) =>
        lessonIndex === index ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const addLesson = () => {
    setForm((current) => ({
      ...current,
      lessons: [
        ...current.lessons,
        {
          title: "",
          contentHtml: "<p>Add the lesson content here.</p>",
          videoUrl: "",
          durationMinutes: 10,
          order: current.lessons.length + 1,
          preview: false
        }
      ]
    }));
  };

  const submitCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      price: form.price,
      category: form.category,
      difficulty: form.difficulty,
      thumbnailUrl: form.thumbnailUrl,
      instructor: {
        name: form.instructorName,
        title: form.instructorTitle,
        bio: form.instructorBio,
        avatarUrl: ""
      },
      lessons: form.lessons.map((lesson, index) => ({ ...lesson, order: index + 1 })),
      featured: form.featured,
      published: form.published
    };
    try {
      const response = await apiFetch<{ course: Course }>(editingId ? `/courses/${editingId}` : "/courses", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      setCourses((current) =>
        editingId
          ? current.map((course) => (course._id === editingId ? response.course : course))
          : [response.course, ...current]
      );
      setEditorOpen(false);
      setEditingId(null);
      setForm(emptyCourse);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (course: Course) => {
    if (!window.confirm(`Delete “${course.title}” and its enrollment history?`)) return;
    try {
      await apiFetch(`/courses/${course._id}`, { method: "DELETE" });
      setCourses((current) => current.filter((item) => item._id !== course._id));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  };

  if (loading) return <Spinner label="Opening admin workspace" />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <span className="admin-kicker">Backoffice</span>
          <h2>AimLearn</h2>
        </div>
        <nav>
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")} type="button">
            <BarChart3 /> Overview
          </button>
          <button className={tab === "courses" ? "active" : ""} onClick={() => setTab("courses")} type="button">
            <BookOpen /> Courses
          </button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")} type="button">
            <Users /> Learners
          </button>
        </nav>
        <div className="admin-sidebar-note">
          <span>Admin access</span>
          <p>Manage content, learners and platform performance.</p>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span>Admin workspace</span>
            <h1>{tab === "overview" ? "Platform overview" : tab === "courses" ? "Course library" : "Learners"}</h1>
          </div>
          {tab === "courses" ? (
            <button className="button button-primary" type="button" onClick={() => openEditor()}>
              <Plus size={17} /> New course
            </button>
          ) : null}
        </header>
        {error ? <div className="form-error">{error}</div> : null}

        {tab === "overview" && report ? (
          <>
            <div className="admin-metrics">
              {[
                { label: "Total learners", value: report.metrics.users, icon: Users },
                { label: "Published courses", value: report.metrics.courses, icon: BookOpen },
                { label: "Enrollments", value: report.metrics.enrollments, icon: UserRound },
                { label: "Lessons completed", value: report.metrics.lessonsCompleted, icon: BarChart3 }
              ].map(({ label, value, icon: Icon }) => (
                <article key={label}>
                  <span>
                    <Icon />
                  </span>
                  <strong>{value.toLocaleString()}</strong>
                  <p>{label}</p>
                </article>
              ))}
            </div>
            <div className="admin-overview-grid">
              <section className="admin-panel">
                <div className="panel-heading">
                  <div>
                    <span>Engagement</span>
                    <h2>Popular courses</h2>
                  </div>
                </div>
                <div className="popular-list">
                  {report.popularCourses.length ? (
                    report.popularCourses.map((course, index) => (
                      <div key={course.courseId}>
                        <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                        <strong>{course.title}</strong>
                        <em>{course.enrollments} enrollments</em>
                      </div>
                    ))
                  ) : (
                    <p className="muted-copy">Enrollment data will appear here.</p>
                  )}
                </div>
              </section>
              <section className="admin-panel">
                <div className="panel-heading">
                  <div>
                    <span>Latest activity</span>
                    <h2>Recent enrollments</h2>
                  </div>
                </div>
                <div className="activity-list">
                  {report.recentEnrollments.length ? (
                    report.recentEnrollments.map((item) => (
                      <div key={item._id}>
                        <Avatar name={item.userId.name} size="small" />
                        <p>
                          <strong>{item.userId.name}</strong>
                          <span>{item.courseId.title}</span>
                        </p>
                        <ChevronRight size={16} />
                      </div>
                    ))
                  ) : (
                    <p className="muted-copy">New enrollments will appear here.</p>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}

        {tab !== "overview" ? (
          <div className="admin-toolbar">
            <label>
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tab === "courses" ? "Search courses" : "Search learners"}
              />
            </label>
            <span>{tab === "courses" ? filteredCourses.length : filteredUsers.length} results</span>
          </div>
        ) : null}

        {tab === "courses" ? (
          <section className="admin-panel table-panel">
            <div className="admin-table">
              <div className="admin-table-head course-row">
                <span>Course</span>
                <span>Category</span>
                <span>Level</span>
                <span>Price</span>
                <span>Actions</span>
              </div>
              {filteredCourses.map((course) => (
                <div className="admin-table-row course-row" key={course._id}>
                  <div>
                    <span className="table-course-art">A</span>
                    <p>
                      <strong>{course.title}</strong>
                      <small>{course.lessons.length} lessons</small>
                    </p>
                  </div>
                  <span>{course.category}</span>
                  <span>{course.difficulty}</span>
                  <span>{formatCurrency(course.price)}</span>
                  <div className="table-actions">
                    <button type="button" onClick={() => openEditor(course)} aria-label={`Edit ${course.title}`}>
                      <Edit3 size={17} />
                    </button>
                    <button type="button" onClick={() => deleteCourse(course)} aria-label={`Delete ${course.title}`}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "users" ? (
          <section className="admin-panel table-panel">
            <div className="admin-table">
              <div className="admin-table-head user-row">
                <span>Learner</span>
                <span>Role</span>
                <span>Enrolled</span>
                <span>Joined</span>
              </div>
              {filteredUsers.map((user) => (
                <div className="admin-table-row user-row" key={user.id}>
                  <div>
                    <Avatar name={user.name} src={user.avatarUrl} size="small" />
                    <p>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </p>
                  </div>
                  <span className={`role-pill ${user.role}`}>{user.role}</span>
                  <span>{user.enrollmentCount} courses</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {editorOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="course-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
            <header>
              <div>
                <span>Course editor</span>
                <h2 id="editor-title">{editingId ? "Edit course" : "Create a new course"}</h2>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close editor">
                <X />
              </button>
            </header>
            <form onSubmit={submitCourse}>
              <div className="editor-section">
                <h3>Course details</h3>
                <div className="form-grid">
                  <label className="span-two">
                    Title
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      required
                      minLength={3}
                    />
                  </label>
                  <label className="span-two">
                    Short description
                    <textarea
                      value={form.shortDescription}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, shortDescription: event.target.value }))
                      }
                      required
                      minLength={20}
                      maxLength={220}
                    />
                  </label>
                  <label className="span-two">
                    Full description
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      required
                      minLength={40}
                    />
                  </label>
                  <label>
                    Category
                    <input
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Difficulty
                    <select
                      value={form.difficulty}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, difficulty: event.target.value as Difficulty }))
                      }
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </label>
                  <label>
                    Price (USD)
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, price: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <label>
                    Thumbnail URL
                    <input
                      type="url"
                      value={form.thumbnailUrl}
                      onChange={(event) => setForm((current) => ({ ...current, thumbnailUrl: event.target.value }))}
                      placeholder="Cloudinary URL (optional)"
                    />
                  </label>
                </div>
              </div>
              <div className="editor-section">
                <h3>Instructor</h3>
                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={form.instructorName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, instructorName: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Professional title
                    <input
                      value={form.instructorTitle}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, instructorTitle: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="span-two">
                    Bio
                    <textarea
                      value={form.instructorBio}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, instructorBio: event.target.value }))
                      }
                      required
                      minLength={10}
                    />
                  </label>
                </div>
              </div>
              <div className="editor-section">
                <div className="editor-section-heading">
                  <h3>Lessons</h3>
                  <button className="text-button" type="button" onClick={addLesson}>
                    <Plus size={16} /> Add lesson
                  </button>
                </div>
                <div className="lesson-editor-list">
                  {form.lessons.map((item, index) => (
                    <fieldset key={item._id ?? index}>
                      <legend>Lesson {index + 1}</legend>
                      <label>
                        Title
                        <input
                          value={item.title}
                          onChange={(event) => updateLesson(index, "title", event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Content HTML
                        <textarea
                          value={item.contentHtml}
                          onChange={(event) => updateLesson(index, "contentHtml", event.target.value)}
                          required
                        />
                      </label>
                      <div className="form-grid">
                        <label>
                          Video URL
                          <input
                            type="url"
                            value={item.videoUrl}
                            onChange={(event) => updateLesson(index, "videoUrl", event.target.value)}
                          />
                        </label>
                        <label>
                          Duration (minutes)
                          <input
                            type="number"
                            min="1"
                            value={item.durationMinutes}
                            onChange={(event) => updateLesson(index, "durationMinutes", Number(event.target.value))}
                          />
                        </label>
                      </div>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={item.preview}
                          onChange={(event) => updateLesson(index, "preview", event.target.checked)}
                        />
                        Allow public preview
                      </label>
                      {form.lessons.length > 1 ? (
                        <button
                          className="danger-link"
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              lessons: current.lessons.filter((_, lessonIndex) => lessonIndex !== index)
                            }))
                          }
                        >
                          <Trash2 size={15} /> Remove lesson
                        </button>
                      ) : null}
                    </fieldset>
                  ))}
                </div>
              </div>
              <div className="editor-section editor-toggles">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
                  />
                  Feature on landing page
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))}
                  />
                  Published
                </label>
              </div>
              <footer>
                <button className="button button-ghost" type="button" onClick={() => setEditorOpen(false)}>
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={saving}>
                  <Save size={17} /> {saving ? "Saving…" : "Save course"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
