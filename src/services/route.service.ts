import { prisma } from "../utils/prisma.js";
import type { CreateRoutePayload } from "../schema/display.schema.js";
import { AppError } from "../utils/AppError.js";

export const getAllRoutes = async () => {
  return await prisma.route.findMany({
    orderBy: { code: "asc" },
  });
};

export const createRoute = async (data: CreateRoutePayload) => {
  const existingByCode = await prisma.route.findFirst({
    where: {
      code: {
        equals: data.code,
        mode: "insensitive",
      },
    },
  });

  if (existingByCode) {
    throw new AppError(
      `Kode rute "${data.code}" sudah terdaftar. Gunakan kode lain.`,
      409,
    );
  }

  const existingByRoute = await prisma.route.findFirst({
    where: {
      OR: [
        {
          origin: { equals: data.origin, mode: "insensitive" },
          destination: { equals: data.destination, mode: "insensitive" },
        },
        {
          origin: { equals: data.destination, mode: "insensitive" },
          destination: { equals: data.origin, mode: "insensitive" },
        },
      ],
    },
  });

  if (existingByRoute) {
    throw new AppError(
      `Rute "${data.origin} - ${data.destination}" sudah terdaftar sebagai ` +
        `"${existingByRoute.origin} - ${existingByRoute.destination}" ` +
        `(kode: ${existingByRoute.code}). Gunakan toggle Pergi/Pulang untuk arah sebaliknya.`,
      409,
    );
  }

  return await prisma.route.create({
    data,
  });
};

export const deleteRoute = async (id: string) => {
  return await prisma.route.delete({
    where: { id },
  });
};
