import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Invalid request", issues: error.issues });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
};
