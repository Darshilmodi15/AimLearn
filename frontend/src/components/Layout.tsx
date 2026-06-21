import { BookOpen, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : undefined);

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const openMenu = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsProfileMenuOpen(true);
  };

  const closeMenu = (delay = 200) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsProfileMenuOpen(false);
      }, delay);
    } else {
      setIsProfileMenuOpen(false);
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      closeMenu(0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu(0);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu(0);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isProfileMenuOpen]);

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
              <div
                ref={menuRef}
                className="profile-menu"
                onMouseEnter={openMenu}
                onMouseLeave={() => closeMenu(200)}
                onBlur={handleBlur}
              >
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  onFocus={openMenu}
                  aria-haspopup="true"
                  aria-expanded={isProfileMenuOpen}
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="small" />
                  <span>{user.name.split(" ")[0]}</span>
                </button>
                <div className={`profile-dropdown ${isProfileMenuOpen ? "is-open" : ""}`}>
                  <Link to="/dashboard" onClick={() => closeMenu(0)}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link to="/courses" onClick={() => closeMenu(0)}>
                    <BookOpen size={16} /> Browse courses
                  </Link>
                  {user.role === "admin" ? (
                    <Link to="/admin" onClick={() => closeMenu(0)}>
                      <ShieldCheck size={16} /> Admin panel
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      closeMenu(0);
                    }}
                  >
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
