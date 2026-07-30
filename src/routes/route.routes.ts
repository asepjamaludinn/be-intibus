import { Router } from "express";
import {
  getRoutes,
  addRoute,
  removeRoute,
} from "../controllers/route.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createRouteSchema } from "../schema/display.schema.js";

export const routeRoutes = Router();

routeRoutes.get("/", getRoutes);
routeRoutes.post("/", validate(createRouteSchema), addRoute);
routeRoutes.delete("/:id", removeRoute);
