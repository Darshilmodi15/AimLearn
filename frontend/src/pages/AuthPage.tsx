import { ArrowRight, BadgeCheck, BookOpenCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../lib/api";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") await signup(form);
      else await login({ email: form.email, password: form.password });
      const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";
  return (
    <section className="auth-page">
      <div className="auth-aside">
        <div>
          <span className="eyebrow light-eyebrow">
            <Sparkles size={15} /> Learn with intention
          </span>
          <h1>{isSignup ? "A better way to build your next skill." : "Welcome back to your learning."}</h1>
          <p>
            {isSignup
              ? "Join thoughtful learners building practical skills through clear, focused courses."
              : "Pick up exactly where you left off and keep your momentum moving."}
          </p>
          <ul>
            <li>
              <BookOpenCheck /> Structured, practical learning paths
            </li>
            <li>
              <BadgeCheck /> Progress saved across every course
            </li>
            <li>
              <ArrowRight /> Learn at your own pace, on any device
            </li>
          </ul>
        </div>
        <blockquote>
          “The clarity of each course made it easy to keep going—even during a busy week.”
          <span>— Arjun Mehta, AimLearn member</span>
        </blockquote>
      </div>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <span className="auth-kicker">{isSignup ? "Create your account" : "Member sign in"}</span>
          <h2>{isSignup ? "Start learning today." : "Good to see you again."}</h2>
          <p>
            {isSignup ? "Already have an account? " : "New to AimLearn? "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link>
          </p>
          {error ? <div className="form-error">{error}</div> : null}
          {isSignup ? (
            <label>
              Full name
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Aarav Sharma"
                required
                minLength={2}
              />
            </label>
          ) : null}
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="e.g. aarav@example.com"
              required
            />
          </label>
          <label>
            <span className="label-row">
              Password
              {!isSignup ? <span>Forgot password?</span> : null}
            </span>
            <span className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={isSignup ? "8+ characters, upper, lower and number" : "Your password"}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button className="button button-primary button-full" type="submit" disabled={loading}>
            {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"} <ArrowRight size={18} />
          </button>
          <small className="terms-copy">
            By continuing, you agree to AimLearn’s terms and acknowledge the privacy policy.
          </small>
        </form>
      </div>
    </section>
  );
}
