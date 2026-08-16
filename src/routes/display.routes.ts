import { Router } from "express";
import {
  sendToDisplay,
  getStatus,
  savePreset,
  updatePreset,
  loadPresets,
} from "../controllers/display.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireDeviceAuth } from "../middlewares/auth.middleware.js";
import {
  displayPayloadSchema,
  presetSchema,
} from "../schema/display.schema.js";

export const displayRoutes = Router();

displayRoutes.post(
  "/send",
  requireDeviceAuth,
  validate(displayPayloadSchema),
  sendToDisplay,
);

displayRoutes.get("/status", getStatus);

displayRoutes.post(
  "/presets",
  requireDeviceAuth,
  validate(presetSchema),
  savePreset,
);
displayRoutes.put(
  "/presets/:id",
  requireDeviceAuth,
  validate(presetSchema),
  updatePreset,
);
displayRoutes.get("/presets", loadPresets);
