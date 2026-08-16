import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyDeviceToken } from "../services/device.service.js";

export const requireDeviceAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const deviceId = req.header("x-device-id");
  const deviceToken = req.header("x-device-token");

  if (!deviceId || !deviceToken) {
    throw new AppError("Unauthorized: kredensial device tidak ditemukan", 401);
  }

  const device = await verifyDeviceToken(deviceId, deviceToken);

  if (!device) {
    throw new AppError(
      "Unauthorized: device token tidak valid atau sudah dicabut",
      401,
    );
  }

  req.device = { id: device.id, deviceId: device.deviceId, name: device.name };
  next();
};
