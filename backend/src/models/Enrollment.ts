import { Schema, model, type Types } from "mongoose";

export interface IEnrollment {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLessons: Types.ObjectId[];
  lastLessonId?: Types.ObjectId;
  pricePaid: number;
  enrolledAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completedLessons: [{ type: Schema.Types.ObjectId }],
    lastLessonId: { type: Schema.Types.ObjectId },
    pricePaid: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);
