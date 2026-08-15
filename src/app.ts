import express from "express";
import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { displayRoutes } from "./routes/display.routes.js";
import { routeRoutes } from "./routes/route.routes.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./utils/AppError.js";

export const app: Application = express();

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new AppError("Akses ditolak oleh kebijakan CORS", 403));
      }
    },
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Terlalu banyak request dari IP ini, coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(express.json());

app.use("/api/display", displayRoutes);
app.use("/api/routes", routeRoutes);

app.get("/", (req, res) => {
  res.send("Smart Bus Display API is running securely!");
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, error: "Route tidak ditemukan" });
});

app.use(globalErrorHandler);
