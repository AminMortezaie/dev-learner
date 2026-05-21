import type { NextFunction, Request, Response, RequestHandler } from "express";

/**
 * Wraps an async handler so rejected promises propagate to Express's error
 * middleware instead of crashing the process with an unhandled rejection.
 */
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
>(
  fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
}
