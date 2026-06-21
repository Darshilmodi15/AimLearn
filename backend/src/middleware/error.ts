import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, `Route ${request.method} ${request.path} was not found.`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Please correct the highlighted fields.",
      errors: error.flatten().fieldErrors
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({ message: error.message });
    return;
  }

  if ((error as { code?: number }).code === 11000) {
    response.status(409).json({ message: "A record with those details already exists." });
    return;
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  response.status(statusCode).json({
    message: statusCode === 500 ? "Something went wrong on the server." : error.message,
    details: error instanceof HttpError ? error.details : undefined,
    stack: env.NODE_ENV === "development" ? error.stack : undefined
  });
};
