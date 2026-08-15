import { Router } from "express";
import {
  sendToDisplay,
  getStatus,
  savePreset,
  updatePreset,
  loadPresets,
} from "../controllers/display.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireApiKey } from "../middlewares/auth.middleware.js";
import {
  displayPayloadSchema,
  presetSchema,
} from "../schema/display.schema.js";

export const displayRoutes = Router();

displayRoutes.post(
  "/send",
  requireApiKey,
  validate(displayPayloadSchema),
  sendToDisplay,
);

displayRoutes.get("/status", getStatus);

displayRoutes.post(
  "/presets",
  requireApiKey,
  validate(presetSchema),
  savePreset,
);
displayRoutes.put(
  "/presets/:id",
  requireApiKey,
  validate(presetSchema),
  updatePreset,
);
displayRoutes.get("/presets", loadPresets);
