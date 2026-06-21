import bcrypt from "bcryptjs";
import slugify from "slugify";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { Course } from "./models/Course.js";
import { User } from "./models/User.js";

const courseSeeds = [
  {
    title: "Product Thinking for Modern Teams",
    shortDescription: "Frame sharper problems, validate assumptions and make confident product decisions.",
    description:
      "A practical course for builders who want to move beyond feature lists and create products grounded in real customer needs.",
    price: 4999,
    category: "Product",
    difficulty: "Intermediate" as const,
    featured: true,
    instructor: {
      name: "Maya Iyer",
      title: "Product strategist & educator",
      bio: "Maya has spent twelve years helping teams turn ambiguous customer problems into focused, valuable products."
    },
    lessonTitles: [
      "From outputs to outcomes",
      "Finding the real problem",
      "Mapping assumptions",
      "Designing useful discovery",
      "Choosing evidence",
      "Making trade-offs visible",
      "Aligning the team",
      "Your product thinking practice"
    ]
  },
  {
    title: "Visual Design Foundations",
    shortDescription: "Build polished interfaces through hierarchy, typography, spacing and intentional colour.",
    description:
      "An approachable visual design system for developers, product managers and early-career designers who want their work to feel considered.",
    price: 0,
    category: "Design",
    difficulty: "Beginner" as const,
    featured: true,
    instructor: {
      name: "Nikhil Sharma",
      title: "Design director",
      bio: "Nikhil makes visual design principles practical for multidisciplinary teams and has led design across consumer and enterprise products."
    },
    lessonTitles: [
      "How people read interfaces",
      "Creating visual hierarchy",
      "Spacing as a system",
      "Typography that communicates",
      "Using colour with restraint",
      "Designing clear components",
      "Building consistent layouts",
      "Critiquing your own work"
    ]
  },
  {
    title: "Data Storytelling That Persuades",
    shortDescription: "Turn raw analysis into clear narratives that help stakeholders understand and act.",
    description:
      "Learn a repeatable framework for choosing evidence, building narrative flow and presenting analytical findings with clarity.",
    price: 5999,
    category: "Data",
    difficulty: "Advanced" as const,
    featured: true,
    instructor: {
      name: "Priya Shah",
      title: "Analytics lead",
      bio: "Priya teaches analysts how to make complex findings memorable, credible and actionable for decision-makers."
    },
    lessonTitles: [
      "Start with the decision",
      "Find the signal",
      "Structure the narrative",
      "Choose the right visual",
      "Write useful annotations",
      "Handle uncertainty",
      "Present with confidence"
    ]
  },
  {
    title: "TypeScript for Confident Frontends",
    shortDescription: "Use TypeScript to design safer React APIs, model application state and prevent common bugs.",
    description:
      "Move from adding types after the fact to using TypeScript as a design tool for maintainable frontend applications.",
    price: 4499,
    category: "Development",
    difficulty: "Intermediate" as const,
    featured: false,
    instructor: {
      name: "Madhav Chawla",
      title: "Staff frontend engineer",
      bio: "Madhav builds design systems and large TypeScript applications, with a focus on API quality and developer experience."
    },
    lessonTitles: [
      "Types as design constraints",
      "Modeling domain data",
      "Discriminated unions",
      "Safe component APIs",
      "Typing asynchronous state",
      "Runtime validation",
      "Refactoring with confidence"
    ]
  },
  {
    title: "Leading Through Ambiguity",
    shortDescription: "Create clarity, communicate decisions and help teams make progress when the path is uncertain.",
    description:
      "A practical leadership course for managers and senior individual contributors working through change and incomplete information.",
    price: 6999,
    category: "Leadership",
    difficulty: "Advanced" as const,
    featured: false,
    instructor: {
      name: "Esha Roy",
      title: "Executive coach",
      bio: "Esha has coached leaders across high-growth technology companies and mission-driven organizations."
    },
    lessonTitles: [
      "Name the uncertainty",
      "Separate facts from assumptions",
      "Set a decision cadence",
      "Communicate what changes",
      "Create psychological safety",
      "Move without false certainty"
    ]
  },
  {
    title: "Customer Research Essentials",
    shortDescription: "Plan useful interviews, ask better questions and turn conversations into reliable insights.",
    description:
      "Learn the core research habits that help product teams understand customer behavior without leading questions or confirmation bias.",
    price: 0,
    category: "Research",
    difficulty: "Beginner" as const,
    featured: false,
    instructor: {
      name: "Ananya Rao",
      title: "UX research consultant",
      bio: "Ananya helps product teams build lightweight, ethical research practices that fit real delivery timelines."
    },
    lessonTitles: [
      "Define what you need to learn",
      "Recruit the right participants",
      "Write a neutral discussion guide",
      "Conduct a strong interview",
      "Synthesize without bias",
      "Share insights that travel"
    ]
  }
];

function lessonContent(title: string, index: number) {
  return `
    <p>This lesson turns <strong>${title.toLowerCase()}</strong> into a practical habit you can use in your work.</p>
    <h2>Start with the purpose</h2>
    <p>Before choosing a framework, be clear about the decision or behavior you want to improve. A useful method serves a clear outcome.</p>
    <blockquote>Good learning changes what you do next, not only what you know now.</blockquote>
    <h2>Put it into practice</h2>
    <ul>
      <li>Choose one current situation where this idea is relevant.</li>
      <li>Write down your assumptions before taking action.</li>
      <li>Try the smallest useful version and observe what changes.</li>
    </ul>
    <p>At the end of lesson ${index + 1}, capture one action you will take this week.</p>
  `;
}

function getLessonQuiz(title: string) {
  return {
    question: `What is the primary outcome when applying the principles of "${title}"?`,
    options: [
      "Application turns theoretical information into practical capability",
      "Moving quickly to the next lesson to finish the course fast",
      "Memorizing the concepts without putting them into practice",
      "Postponing the work until you have more free time"
    ],
    correctAnswerIndex: 0
  };
}

async function seed() {
  await connectDatabase();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@aimlearn.dev";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("Set SEED_ADMIN_PASSWORD to at least 12 characters before running the seed.");
  }

  await User.findOneAndUpdate(
    { email: adminEmail.toLowerCase() },
    {
      name: "AimLearn Admin",
      email: adminEmail.toLowerCase(),
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "admin"
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  for (const course of courseSeeds) {
    const slug = slugify(course.title, { lower: true, strict: true });
    await Course.findOneAndUpdate(
      { slug },
      {
        ...course,
        slug,
        published: true,
        lessons: course.lessonTitles.map((title, index) => ({
          title,
          contentHtml: lessonContent(title, index),
          durationMinutes: 12 + (index % 4) * 4,
          order: index + 1,
          preview: index === 0,
          quiz: getLessonQuiz(title)
        }))
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  console.info(`Seeded ${courseSeeds.length} courses and admin ${adminEmail}.`);
}

void seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
