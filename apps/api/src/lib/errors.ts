import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod/v4";

export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ status: 404, title: "Not Found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 400,
      title: "Validation failed",
      detail: err.message,
      issues: err.issues,
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({
      status: err.status,
      title: err.message,
      detail: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }
  // eslint-disable-next-line no-console
  console.error("[api-server] Unhandled error:", err);
  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({ status: 500, title: "Internal Server Error", detail: message });
};
