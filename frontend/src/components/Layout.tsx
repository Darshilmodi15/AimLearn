import { BookOpen, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : undefined);

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <button
            className="mobile-menu-button"
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
            <NavLink to="/courses" className={navClass} onClick={() => setOpen(false)}>
              Explore courses
            </NavLink>
            {user ? (
              <NavLink to="/dashboard" className={navClass} onClick={() => setOpen(false)}>
                My learning
              </NavLink>
            ) : (
              <a href="/#how-it-works" onClick={() => setOpen(false)}>
                How it works
              </a>
            )}
            {user?.role === "admin" ? (
              <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            ) : null}
          </nav>
          <div className="header-actions">
            {user ? (
              <div className="profile-menu">
                <Link to="/dashboard" className="profile-trigger">
                  <Avatar name={user.name} src={user.avatarUrl} size="small" />
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
                <div className="profile-dropdown">
                  <Link to="/dashboard">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link to="/courses">
                    <BookOpen size={16} /> Browse courses
                  </Link>
                  {user.role === "admin" ? (
                    <Link to="/admin">
                      <ShieldCheck size={16} /> Admin panel
                    </Link>
                  ) : null}
                  <button type="button" onClick={handleLogout}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link className="button button-ghost" to="/login">
                  Log in
                </Link>
                <Link className="button button-primary button-small" to="/signup">
                  Start learning
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-intro">
            <Logo />
            <p>Thoughtful courses for people who want to make meaningful progress.</p>
          </div>
          <div>
            <h3>Learn</h3>
            <Link to="/courses">Explore courses</Link>
            <Link to="/signup">Create account</Link>
            <Link to="/dashboard">My learning</Link>
          </div>
          <div>
            <h3>Company</h3>
            <a href="/#how-it-works">How it works</a>
            <a href="mailto:hello@aimlearn.dev">Contact</a>
            <span>Privacy</span>
          </div>
          <div className="footer-note">
            <p>Keep learning, deliberately.</p>
            <span>© {new Date().getFullYear()} AimLearn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
