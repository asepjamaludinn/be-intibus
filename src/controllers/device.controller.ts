import type { Request, Response } from "express";
import * as deviceService from "../services/device.service.js";

export const pairDevice = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await deviceService.redeemPairingCode(req.body);
  res.status(201).json({
    success: true,
    message: "Device berhasil dipasangkan",
    data: result,
  });
};
