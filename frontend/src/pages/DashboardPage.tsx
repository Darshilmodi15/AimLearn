import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Compass,
  Flame,
  GraduationCap,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CourseCard } from "../components/CourseCard";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { apiFetch, getErrorMessage } from "../lib/api";
import type { Course, Enrollment, User } from "../types";

export function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"learning" | "settings">("learning");
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    password: "",
    confirmPassword: ""
  });
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm((current) => ({
        ...current,
        name: user.name,
        avatarUrl: user.avatarUrl ?? ""
      }));
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      apiFetch<{ enrollments: Enrollment[] }>("/enrollments/me"),
      apiFetch<{ recommendations: Course[] }>("/recommendations")
    ])
      .then(([enrollmentResponse, recommendationResponse]) => {
        setEnrollments(enrollmentResponse.enrollments);
        setRecommendations(recommendationResponse.recommendations);
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setProfileSaving(true);
    setError("");
    setProfileSuccess("");
    try {
      const payload: Record<string, string> = {
        name: profileForm.name,
        avatarUrl: profileForm.avatarUrl
      };
      if (profileForm.password) {
        payload.password = profileForm.password;
      }
      const response = await apiFetch<{ user: User }>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      updateUser(response.user);
      setProfileSuccess("Your profile has been updated successfully.");
      setProfileForm((current) => ({ ...current, password: "", confirmPassword: "" }));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setProfileSaving(false);
    }
  };

  const stats = useMemo(() => {
    const completedLessons = enrollments.reduce((sum, item) => sum + item.completedLessons.length, 0);
    const completedCourses = enrollments.filter((item) => item.progressPercent === 100).length;
    return { completedLessons, completedCourses };
  }, [enrollments]);

  if (loading) return <Spinner label="Preparing your dashboard" />;

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div className="container">
          <div>
            <span className="eyebrow">
              <Sparkles size={15} /> Your learning space
            </span>
            <h1>Welcome back, {user?.name.split(" ")[0]}.</h1>
            <p>Small steps, repeated with intention, become remarkable progress.</p>
          </div>
          <Link className="button button-secondary" to="/courses">
            <Compass size={17} /> Explore courses
          </Link>
        </div>
      </section>
      <div className="container dashboard-content">
        {searchParams.get("payment") === "success" ? (
          <div className="success-banner">
            <CheckCircle2 />
            <div>
              <strong>Payment received.</strong>
              <span>Your enrollment will appear as soon as Stripe confirms the checkout.</span>
            </div>
          </div>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}

        <div className="dashboard-tabs">
          <button
            className={activeTab === "learning" ? "active" : undefined}
            onClick={() => {
              setActiveTab("learning");
              setError("");
              setProfileSuccess("");
            }}
            type="button"
          >
            <BookOpen size={17} /> My Learning
          </button>
          <button
            className={activeTab === "settings" ? "active" : undefined}
            onClick={() => {
              setActiveTab("settings");
              setError("");
              setProfileSuccess("");
            }}
            type="button"
          >
            <UserRound size={17} /> Profile Settings
          </button>
        </div>

        {activeTab === "learning" ? (
          <>
            <div className="stat-grid">
              <article>
                <span className="stat-icon">
                  <BookOpen />
                </span>
                <div>
                  <strong>{enrollments.length}</strong>
                  <span>Courses enrolled</span>
                </div>
              </article>
              <article>
                <span className="stat-icon">
                  <CheckCircle2 />
                </span>
                <div>
                  <strong>{stats.completedLessons}</strong>
                  <span>Lessons completed</span>
                </div>
              </article>
              <article>
                <span className="stat-icon">
                  <GraduationCap />
                </span>
                <div>
                  <strong>{stats.completedCourses}</strong>
                  <span>Courses completed</span>
                </div>
              </article>
              <article>
                <span className="stat-icon">
                  <Flame />
                </span>
                <div>
                  <strong>{stats.completedLessons ? "Active" : "Ready"}</strong>
                  <span>Learning momentum</span>
                </div>
              </article>
            </div>

            <section className="dashboard-section">
              <div className="dashboard-section-title">
                <div>
                  <span className="eyebrow">Your courses</span>
                  <h2>Continue learning</h2>
                </div>
                <span className="date-note">
                  <CalendarDays size={16} /> Progress saves automatically
                </span>
              </div>
              {enrollments.length ? (
                <div className="course-grid dashboard-course-grid">
                  {enrollments.map((enrollment) => (
                    <CourseCard
                      course={enrollment.courseId}
                      progress={enrollment.progressPercent}
                      dashboard
                      key={enrollment._id}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-learning-state">
                  <span>
                    <BookOpen />
                  </span>
                  <h3>Your first course is waiting.</h3>
                  <p>Browse the library and choose one skill you want to make real progress on.</p>
                  <Link className="button button-primary" to="/courses">
                    Find a course <ArrowRight size={17} />
                  </Link>
                </div>
              )}
            </section>

            {recommendations.length ? (
              <section className="dashboard-section recommendations-section">
                <div className="dashboard-section-title">
                  <div>
                    <span className="eyebrow">Chosen for you</span>
                    <h2>Keep your curiosity moving</h2>
                  </div>
                  <Link className="text-link" to="/courses">
                    Browse all <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="course-grid">
                  {recommendations.slice(0, 3).map((course) => (
                    <CourseCard course={course} key={course._id} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="dashboard-section settings-section">
            <div className="dashboard-section-title">
              <div>
                <span className="eyebrow">Settings</span>
                <h2>Update your profile</h2>
              </div>
            </div>
            {profileSuccess ? <div className="success-banner">{profileSuccess}</div> : null}
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-grid">
                <label>
                  Full name
                  <input
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="e.g. Aarav Mehta"
                    required
                    minLength={2}
                  />
                </label>
                <label>
                  Avatar image URL
                  <input
                    type="url"
                    value={profileForm.avatarUrl}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))
                    }
                    placeholder="e.g. https://example.com/avatar.jpg"
                  />
                </label>
                <label>
                  New password (leave blank to keep current)
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="8+ characters, upper, lower and number"
                    minLength={8}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    placeholder="Repeat new password"
                    required={!!profileForm.password}
                  />
                </label>
              </div>
              <button className="button button-primary" type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving changes..." : "Save changes"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
