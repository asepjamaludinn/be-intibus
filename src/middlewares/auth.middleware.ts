import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export const requireApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.error(
      "[SECURITY] Variabel API_KEY belum dikonfigurasi di file .env",
    );

    throw new AppError(
      "Internal Server Error: Konfigurasi keamanan tidak lengkap",
      500,
    );
  }

  if (!apiKey || apiKey !== validApiKey) {
    throw new AppError(
      "Unauthorized: API Key tidak valid atau tidak ditemukan",
      401,
    );
  }

  next();
};
