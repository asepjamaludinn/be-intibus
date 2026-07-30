import type { Request, Response, NextFunction } from "express";
import * as routeService from "../services/route.service.js";

export const getRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const routes = await routeService.getAllRoutes();
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
};

export const addRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const newRoute = await routeService.createRoute(req.body);
    res.status(201).json({
      success: true,
      message: "Rute berhasil ditambahkan",
      data: newRoute,
    });
  } catch (error) {
    next(error);
  }
};

export const removeRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    await routeService.deleteRoute(id);
    res.status(200).json({
      success: true,
      message: "Rute berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};
