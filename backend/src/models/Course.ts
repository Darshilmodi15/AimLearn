import { Schema, model, type Types } from "mongoose";

export interface IQuiz {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  contentHtml: string;
  videoUrl?: string;
  durationMinutes: number;
  order: number;
  preview: boolean;
  quiz?: IQuiz;
}

export interface ICourse {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  thumbnailUrl?: string;
  instructor: {
    name: string;
    title: string;
    bio: string;
    avatarUrl?: string;
  };
  lessons: ILesson[];
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
  title: { type: String, required: true, trim: true },
  contentHtml: { type: String, required: true },
  videoUrl: { type: String, trim: true },
  durationMinutes: { type: Number, min: 1, default: 10 },
  order: { type: Number, min: 1, required: true },
  preview: { type: Boolean, default: false },
  quiz: {
    question: { type: String, trim: true },
    options: { type: [String], default: [] },
    correctAnswerIndex: { type: Number, default: 0 }
  }
});

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    category: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true
    },
    thumbnailUrl: { type: String, trim: true },
    instructor: {
      name: { type: String, required: true },
      title: { type: String, required: true },
      bio: { type: String, required: true },
      avatarUrl: { type: String }
    },
    lessons: { type: [lessonSchema], default: [] },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", shortDescription: "text", category: "text" });
courseSchema.index({ category: 1, difficulty: 1, price: 1 });

export const Course = model<ICourse>("Course", courseSchema);
