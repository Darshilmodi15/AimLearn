import type { HydratedDocument } from "mongoose";
import type { IUser } from "../models/User.js";

export function serializeUser(user: HydratedDocument<IUser> | IUser & { _id?: unknown }) {
  const record = user as IUser & { _id?: unknown };
  return {
    id: String(record._id ?? ""),
    name: record.name,
    email: record.email,
    role: record.role,
    avatarUrl: record.avatarUrl,
    createdAt: record.createdAt
  };
}
