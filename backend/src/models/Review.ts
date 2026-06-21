import { Schema, model, type Types } from "mongoose";

export interface IReview {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, trim: true, maxlength: 800 }
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Review = model<IReview>("Review", reviewSchema);
