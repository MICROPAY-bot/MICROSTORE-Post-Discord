import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(err.message ?? "Unhandled error", { stack: err.stack, path: req.originalUrl });
  const status = err.status ?? 500;
  res.status(status).json({
    success: false,
    message: err.message ?? "Internal server error"
  });
}
