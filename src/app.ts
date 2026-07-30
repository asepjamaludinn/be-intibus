import express from "express";
import type { Application } from "express";
import cors from "cors";
import { displayRoutes } from "./routes/display.routes.js";
import { routeRoutes } from "./routes/route.routes.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";

export const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/display", displayRoutes);
app.use("/api/routes", routeRoutes);

app.get("/", (req, res) => {
  res.send("Smart Bus Display API is running with PostgreSQL!");
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, error: "Route tidak ditemukan" });
});

app.use(globalErrorHandler);
