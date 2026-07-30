import type { Request, Response, NextFunction } from "express";
import * as displayService from "../services/display.service.js";

export const sendToDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = await displayService.updateDisplayState(req.body);
    res.status(200).json({
      success: true,
      message: "Payload berhasil dikirim ke panel via MQTT",
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatus = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const status = displayService.getDisplayStatus();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

// --- DIUBAH KE ASYNC ---
export const savePreset = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, payload } = req.body;
    const newPreset = await displayService.createPreset(name, payload);

    res.status(201).json({
      success: true,
      message: "Preset disimpan di database",
      data: newPreset,
    });
  } catch (error) {
    next(error);
  }
};

// --- DIUBAH KE ASYNC ---
export const loadPresets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const presets = await displayService.getAllPresets();
    res.status(200).json({ success: true, data: presets });
  } catch (error) {
    next(error);
  }
};
