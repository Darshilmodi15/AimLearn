import type { Course } from "../types";

const sharedInstructor = {
  name: "Maya Bennett",
  title: "Product strategist & educator",
  bio: "Maya has helped early-stage teams turn complex ideas into focused, useful products."
};

export const demoCourses: Course[] = [
  {
    _id: "demo-product",
    title: "Product Thinking for Modern Teams",
    slug: "product-thinking-for-modern-teams",
    shortDescription: "Learn to frame sharper problems, validate assumptions and make confident product decisions.",
    description:
      "A practical course for builders who want to move beyond feature lists and create products grounded in real customer needs.",
    price: 79,
    category: "Product",
    difficulty: "Intermediate",
    instructor: sharedInstructor,
    lessons: Array.from({ length: 8 }, (_, index) => ({
      _id: `product-${index}`,
      title: `Product thinking lesson ${index + 1}`,
      contentHtml: "<p>Course lesson content.</p>",
      durationMinutes: 18,
      order: index + 1,
      preview: index === 0
    })),
    featured: true,
    published: true
  },
  {
    _id: "demo-design",
    title: "Visual Design Foundations",
    slug: "visual-design-foundations",
    shortDescription: "Build polished interfaces through hierarchy, typography, spacing and intentional colour.",
    description:
      "An approachable visual design system for developers, product managers and early-career designers.",
    price: 0,
    category: "Design",
    difficulty: "Beginner",
    instructor: {
      name: "Noah Williams",
      title: "Design director",
      bio: "Noah makes visual design principles practical for multidisciplinary teams."
    },
    lessons: Array.from({ length: 10 }, (_, index) => ({
      _id: `design-${index}`,
      title: `Design foundation ${index + 1}`,
      contentHtml: "<p>Course lesson content.</p>",
      durationMinutes: 14,
      order: index + 1,
      preview: index === 0
    })),
    featured: true,
    published: true
  },
  {
    _id: "demo-data",
    title: "Data Storytelling That Persuades",
    slug: "data-storytelling-that-persuades",
    shortDescription: "Turn raw analysis into clear narratives that help stakeholders understand and act.",
    description:
      "Learn a repeatable framework for choosing evidence, building narrative flow and presenting with clarity.",
    price: 99,
    category: "Data",
    difficulty: "Advanced",
    instructor: {
      name: "Priya Shah",
      title: "Analytics lead",
      bio: "Priya teaches analysts how to make complex findings memorable and actionable."
    },
    lessons: Array.from({ length: 7 }, (_, index) => ({
      _id: `data-${index}`,
      title: `Data storytelling lesson ${index + 1}`,
      contentHtml: "<p>Course lesson content.</p>",
      durationMinutes: 22,
      order: index + 1,
      preview: index === 0
    })),
    featured: true,
    published: true
  }
];
