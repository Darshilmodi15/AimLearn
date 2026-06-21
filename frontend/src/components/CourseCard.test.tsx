import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CourseCard } from "./CourseCard";
import type { Course } from "../types";

const course: Course = {
  _id: "course-1",
  title: "Practical Product Thinking",
  slug: "practical-product-thinking",
  shortDescription: "A focused course for making stronger product decisions with evidence.",
  description: "A complete course description.",
  price: 79,
  category: "Product",
  difficulty: "Intermediate",
  instructor: {
    name: "Maya Bennett",
    title: "Product strategist",
    bio: "Experienced product strategist and educator."
  },
  lessons: [
    {
      _id: "lesson-1",
      title: "Outcomes over output",
      contentHtml: "<p>Lesson content</p>",
      durationMinutes: 20,
      order: 1,
      preview: true
    }
  ],
  featured: true,
  published: true
};

describe("CourseCard", () => {
  it("renders course information and a details link", () => {
    render(
      <MemoryRouter>
        <CourseCard course={course} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: course.title })).not.toBeNull();
    expect(screen.getByText("$79")).not.toBeNull();
    expect(screen.getByText("1 lessons")).not.toBeNull();
    expect(screen.getByRole("link", { name: `View ${course.title}` }).getAttribute("href")).toBe(
      `/courses/${course.slug}`
    );
  });
});
