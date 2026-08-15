import type { Request, Response } from "express";
import * as displayService from "../services/display.service.js";

export const sendToDisplay = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const payload = await displayService.updateDisplayState(req.body);
  res.status(200).json({
    success: true,
    message:
      "State display berhasil disinkronisasi di database server (Kirim Bluetooth dilakukan via App)",
    data: payload,
  });
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  const status = await displayService.getDisplayStatus();
  res.status(200).json(status);
};

export const savePreset = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, payload } = req.body;
  const newPreset = await displayService.createPreset(name, payload);

  res.status(201).json({
    success: true,
    message: "Preset disimpan di database",
    data: newPreset,
  });
};

export const updatePreset = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { name, payload } = req.body;
  const updatedPreset = await displayService.updatePreset(id, name, payload);

  res.status(200).json({
    success: true,
    message: "Preset berhasil diperbarui",
    data: updatedPreset,
  });
};

export const loadPresets = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const presets = await displayService.getAllPresets();
  res.status(200).json({ success: true, data: presets });
};
