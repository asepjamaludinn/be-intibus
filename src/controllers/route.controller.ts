import type { Request, Response } from "express";
import * as routeService from "../services/route.service.js";

export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  const routes = await routeService.getAllRoutes();
  res.status(200).json({ success: true, data: routes });
};

export const addRoute = async (req: Request, res: Response): Promise<void> => {
  const newRoute = await routeService.createRoute(req.body);
  res.status(201).json({
    success: true,
    message: "Rute berhasil ditambahkan",
    data: newRoute,
  });
};

export const removeRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  await routeService.deleteRoute(id);
  res.status(200).json({
    success: true,
    message: "Rute berhasil dihapus",
  });
};
