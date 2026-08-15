import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { Prisma } from "@prisma/client";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("\n========== ERROR ==========");
  console.error("Name   :", err.name);
  console.error("Message:", err.message);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("Prisma Code:", err.code);
    console.error("Prisma Meta:", err.meta);
    console.error("Prisma Client Version:", err.clientVersion);
  }

  console.error("Stack:", err.stack);
  console.error("===========================\n");

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        res.status(409).json({
          success: false,
          error: "Data tersebut sudah terdaftar.",
          detail: err.meta,
        });
        return;

      case "P2025":
        res.status(404).json({
          success: false,
          error: "Data tidak ditemukan.",
        });
        return;

      case "P2003":
        res.status(400).json({
          success: false,
          error: "Relasi data tidak valid.",
          detail: err.meta,
        });
        return;

      default:
        res.status(400).json({
          success: false,
          error: "Database error.",
          code: err.code,
          detail: err.meta,
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: "Data tidak sesuai schema Prisma.",
      detail: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
};
