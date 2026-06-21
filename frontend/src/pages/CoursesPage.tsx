import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { CourseCard } from "../components/CourseCard";
import { FilterBar, type CourseFilters } from "../components/FilterBar";
import { Spinner } from "../components/Spinner";
import { apiFetch, getErrorMessage } from "../lib/api";
import type { Course, Pagination } from "../types";

const initialFilters: CourseFilters = { search: "", category: "", difficulty: "", price: "" };

export function CoursesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const deferredSearch = useDeferredValue(filters.search);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 9, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = (page = 1) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "9" });
    if (deferredSearch) params.set("search", deferredSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.price) params.set("price", filters.price);

    apiFetch<{ courses: Course[]; categories: string[]; pagination: Pagination }>(`/courses?${params}`)
      .then((response) => {
        setCourses(response.courses);
        setCategories(response.categories);
        setPagination(response.pagination);
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
    // Primitive filter values intentionally control this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch, filters.category, filters.difficulty, filters.price]);

  return (
    <div className="page-shell">
      <section className="page-hero compact-hero">
        <div className="container">
          <span className="eyebrow">Explore the library</span>
          <h1>Find your next useful skill.</h1>
          <p>Focused courses, experienced instructors and a clear path from first lesson to real-world application.</p>
        </div>
      </section>
      <section className="container catalog-section">
        <FilterBar
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onClear={() => setFilters(initialFilters)}
        />
        <div className="catalog-summary">
          <p>
            <strong>{pagination.total}</strong> courses
          </p>
          <span>Curated and updated by practitioners</span>
        </div>
        {loading ? <Spinner label="Finding courses" /> : null}
        {error ? (
          <div className="state-card error-state">
            <h2>We couldn’t load the course library.</h2>
            <p>{error}</p>
            <button className="button button-primary" type="button" onClick={() => loadCourses()}>
              Try again
            </button>
          </div>
        ) : null}
        {!loading && !error && courses.length === 0 ? (
          <div className="state-card">
            <h2>No courses match those filters.</h2>
            <p>Clear one or two filters and explore the rest of the library.</p>
            <button className="button button-secondary" type="button" onClick={() => setFilters(initialFilters)}>
              Clear filters
            </button>
          </div>
        ) : null}
        {!loading && courses.length ? (
          <>
            <div className="course-grid catalog-grid">
              {courses.map((course) => (
                <CourseCard course={course} key={course._id} />
              ))}
            </div>
            {pagination.pages > 1 ? (
              <nav className="pagination" aria-label="Course pages">
                <button
                  type="button"
                  disabled={pagination.page === 1}
                  onClick={() => loadCourses(pagination.page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => loadCourses(pagination.page + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
