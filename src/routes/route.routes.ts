import { Router } from "express";
import {
  getRoutes,
  addRoute,
  removeRoute,
} from "../controllers/route.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requireApiKey } from "../middlewares/auth.middleware.js";
import { createRouteSchema } from "../schema/display.schema.js";

export const routeRoutes = Router();

routeRoutes.get("/", getRoutes);

routeRoutes.post("/", requireApiKey, validate(createRouteSchema), addRoute);
routeRoutes.delete("/:id", requireApiKey, removeRoute);
