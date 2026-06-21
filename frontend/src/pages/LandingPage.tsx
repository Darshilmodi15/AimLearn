import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CirclePlay,
  Compass,
  Sparkles,
  Star,
  Target
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { CourseCard } from "../components/CourseCard";
import { apiFetch } from "../lib/api";
import { demoCourses } from "../lib/demoCourses";
import type { Course } from "../types";

const benefits = [
  {
    icon: Compass,
    title: "Clear learning paths",
    copy: "Every course is structured around outcomes, so you always know what to learn next."
  },
  {
    icon: BookOpenCheck,
    title: "Practical by design",
    copy: "Short lessons, useful exercises and ideas you can apply to real work immediately."
  },
  {
    icon: Target,
    title: "Progress you can see",
    copy: "Track completed lessons, keep your momentum and return exactly where you left off."
  }
];

export function LandingPage() {
  const [featured, setFeatured] = useState<Course[]>(demoCourses);

  useEffect(() => {
    apiFetch<{ courses: Course[] }>("/courses?featured=true&limit=3")
      .then((response) => {
        if (response.courses.length) setFeatured(response.courses);
      })
      .catch(() => undefined);
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={15} /> Learning, with direction
            </span>
            <h1>Build skills that move your work—and your life—forward.</h1>
            <p>
              Thoughtfully designed courses from experienced practitioners. Learn at your pace, apply what matters and
              make progress you can feel.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/courses">
                Explore courses <ArrowRight size={18} />
              </Link>
              <a className="button button-quiet" href="#how-it-works">
                <CirclePlay size={19} /> See how it works
              </a>
            </div>
            <div className="hero-trust">
              <div className="avatar-stack" aria-hidden="true">
                <Avatar name="Maya Bennett" size="small" />
                <Avatar name="Priya Shah" size="small" />
                <Avatar name="Noah Williams" size="small" />
              </div>
              <div>
                <span className="stars" aria-label="Rated 4.9 out of 5">
                  ★★★★★
                </span>
                <p>Trusted by 2,800+ curious learners</p>
              </div>
            </div>
          </div>
          <div className="hero-showcase" aria-label="AimLearn learning dashboard preview">
            <span className="decorative-spark spark-one">✦</span>
            <span className="decorative-spark spark-two">✧</span>
            <div className="showcase-window">
              <div className="showcase-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="showcase-content">
                <aside className="showcase-sidebar">
                  <span className="mini-logo">A</span>
                  <span className="sidebar-line active" />
                  <span className="sidebar-line" />
                  <span className="sidebar-line short" />
                </aside>
                <div className="showcase-main">
                  <div className="showcase-heading">
                    <div>
                      <small>Welcome back, Alex</small>
                      <strong>Continue learning</strong>
                    </div>
                    <span className="mini-avatar">AM</span>
                  </div>
                  <div className="learning-panel">
                    <div className="learning-art">
                      <span>↗</span>
                    </div>
                    <div className="learning-copy">
                      <small>PRODUCT • LESSON 5 OF 8</small>
                      <strong>Product Thinking for Modern Teams</strong>
                      <div className="mini-progress">
                        <span />
                      </div>
                      <button type="button">Continue learning</button>
                    </div>
                  </div>
                  <div className="showcase-stats">
                    <div>
                      <BarChart3 size={17} />
                      <strong>68%</strong>
                      <small>course progress</small>
                    </div>
                    <div>
                      <BadgeCheck size={17} />
                      <strong>12</strong>
                      <small>lessons complete</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-note">
              <span className="floating-check">✓</span>
              <div>
                <strong>Lesson complete</strong>
                <small>Your progress has been saved</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip" aria-label="Learning categories">
        <div className="container">
          <span>Product</span>
          <span>Design</span>
          <span>Technology</span>
          <span>Business</span>
          <span>Data</span>
          <span>Leadership</span>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow">Designed for meaningful progress</span>
            <h2>Learning that respects your time.</h2>
            <p>Everything you need to move from curiosity to capability—without the noise.</p>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, title, copy }, index) => (
              <article className="benefit-card" key={title}>
                <span className="benefit-number">0{index + 1}</span>
                <span className="benefit-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-heading row-heading">
            <div>
              <span className="eyebrow">Curated for curious minds</span>
              <h2>Courses worth your attention.</h2>
            </div>
            <Link className="text-link" to="/courses">
              View all courses <ArrowRight size={17} />
            </Link>
          </div>
          <div className="course-grid">
            {featured.map((course) => (
              <CourseCard course={course} key={course._id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section testimonial-section">
        <div className="container testimonial-grid">
          <div className="quote-mark">“</div>
          <blockquote>
            <div className="quote-stars">
              <Star size={17} fill="currentColor" />
              <Star size={17} fill="currentColor" />
              <Star size={17} fill="currentColor" />
              <Star size={17} fill="currentColor" />
              <Star size={17} fill="currentColor" />
            </div>
            <p>
              AimLearn gave me the structure I was missing. I stopped collecting random tutorials and started building
              skills I could actually use in my work.
            </p>
            <footer>
              <Avatar name="Elena Rodriguez" />
              <div>
                <strong>Elena Rodriguez</strong>
                <span>Senior product designer</span>
              </div>
            </footer>
          </blockquote>
          <div className="testimonial-metric">
            <strong>94%</strong>
            <span>of learners complete the course they start</span>
          </div>
        </div>
      </section>

      <section className="container cta-section">
        <div>
          <span className="eyebrow">Your next chapter</span>
          <h2>Start learning with intention.</h2>
          <p>Join a community of people making steady, meaningful progress.</p>
        </div>
        <Link className="button button-light" to="/signup">
          Create your free account <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
