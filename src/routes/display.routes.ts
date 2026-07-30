import { Router } from "express";
import {
  sendToDisplay,
  getStatus,
  savePreset,
  loadPresets,
} from "../controllers/display.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  displayPayloadSchema,
  presetSchema,
} from "../schema/display.schema.js";

export const displayRoutes = Router();

displayRoutes.post("/send", validate(displayPayloadSchema), sendToDisplay);
displayRoutes.get("/status", getStatus);
displayRoutes.post("/presets", validate(presetSchema), savePreset);
displayRoutes.get("/presets", loadPresets);
