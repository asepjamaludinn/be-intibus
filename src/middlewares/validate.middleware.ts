import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { AnyZodObject } from "zod";
import { AppError } from "../utils/AppError.js";

export const validate = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors.map((e) => e.message).join(", ");

        throw new AppError(`Validasi Gagal: ${errorMessage}`, 400);
      }

      throw error;
    }
  };
};
