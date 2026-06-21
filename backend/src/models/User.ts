import { Schema, model } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: "user" | "admin";
  avatarUrl?: string;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      select: false
    },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatarUrl: { type: String, trim: true },
    refreshTokenHash: { type: String, select: false }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
