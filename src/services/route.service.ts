import { prisma } from "../utils/prisma.js";
import type { CreateRoutePayload } from "../schema/display.schema.js";

export const getAllRoutes = async () => {
  return await prisma.route.findMany({
    orderBy: { code: "asc" },
  });
};

export const createRoute = async (data: CreateRoutePayload) => {
  return await prisma.route.create({
    data,
  });
};

export const deleteRoute = async (id: string) => {
  return await prisma.route.delete({
    where: { id },
  });
};
