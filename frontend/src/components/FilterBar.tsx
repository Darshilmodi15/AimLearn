import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Difficulty } from "../types";

export interface CourseFilters {
  search: string;
  category: string;
  difficulty: "" | Difficulty;
  price: "" | "free" | "paid";
}

export function FilterBar({
  filters,
  categories,
  onChange,
  onClear
}: {
  filters: CourseFilters;
  categories: string[];
  onChange: (filters: CourseFilters) => void;
  onClear: () => void;
}) {
  const active = Boolean(filters.search || filters.category || filters.difficulty || filters.price);
  return (
    <div className="filter-panel">
      <label className="search-input">
        <Search size={19} aria-hidden="true" />
        <span className="sr-only">Search courses</span>
        <input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search courses"
        />
      </label>
      <div className="filter-selects">
        <span className="filter-label">
          <SlidersHorizontal size={17} /> Filters
        </span>
        <select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <select
          aria-label="Filter by difficulty"
          value={filters.difficulty}
          onChange={(event) => onChange({ ...filters, difficulty: event.target.value as CourseFilters["difficulty"] })}
        >
          <option value="">All levels</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <select
          aria-label="Filter by price"
          value={filters.price}
          onChange={(event) => onChange({ ...filters, price: event.target.value as CourseFilters["price"] })}
        >
          <option value="">Any price</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        {active ? (
          <button className="text-button" type="button" onClick={onClear}>
            <X size={16} /> Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
