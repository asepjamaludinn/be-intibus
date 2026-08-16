import { Router } from "express";
import {
  getRoutes,
  addRoute,
  removeRoute,
} from "../controllers/route.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireDeviceAuth } from "../middlewares/auth.middleware.js";
import { createRouteSchema } from "../schema/display.schema.js";

export const routeRoutes = Router();

routeRoutes.get("/", getRoutes);

routeRoutes.post("/", requireDeviceAuth, validate(createRouteSchema), addRoute);
routeRoutes.delete("/:id", requireDeviceAuth, removeRoute);
