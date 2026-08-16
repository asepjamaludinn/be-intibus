import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pairDevice } from "../controllers/device.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { pairDeviceSchema } from "../schema/device.schema.js";

export const deviceRoutes = Router();

const pairingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Terlalu banyak percobaan pairing. Coba lagi dalam 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

deviceRoutes.post(
  "/pair",
  pairingLimiter,
  validate(pairDeviceSchema),
  pairDevice,
);
