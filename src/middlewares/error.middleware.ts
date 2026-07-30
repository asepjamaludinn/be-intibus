import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
};
