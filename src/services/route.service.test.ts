import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

vi.mock("../utils/prisma.js", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep() };
});

import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/AppError.js";
import { createRoute, deleteRoute, getAllRoutes } from "./route.service.js";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

const existingRoute = {
  id: "route-1",
  code: "B1",
  origin: "Bandung",
  destination: "Garut",
  createdAt: new Date(),
};

describe("route.service.createRoute", () => {
  it("melempar AppError 409 ketika kode rute sudah terdaftar", async () => {
    prismaMock.route.findFirst.mockResolvedValueOnce(existingRoute as any);

    await expect(
      createRoute({
        code: "B1",
        origin: "Jakarta",
        destination: "Bogor",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(prismaMock.route.create).not.toHaveBeenCalled();
  });

  it("melempar AppError 409 ketika kombinasi origin-destination sudah ada (searah)", async () => {
    prismaMock.route.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingRoute as any);

    await expect(
      createRoute({
        code: "B9",
        origin: "Bandung",
        destination: "Garut",
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(prismaMock.route.create).not.toHaveBeenCalled();
  });

  it("melempar AppError 409 ketika kombinasi sama tapi arah dibalik (Garut - Bandung)", async () => {
    prismaMock.route.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingRoute as any);

    await expect(
      createRoute({
        code: "B9",
        origin: "Garut",
        destination: "Bandung",
      }),
    ).rejects.toThrow(/toggle Pergi\/Pulang/);
  });

  it("berhasil membuat rute baru ketika tidak ada duplikat sama sekali", async () => {
    prismaMock.route.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    prismaMock.route.create.mockResolvedValueOnce({
      id: "route-new",
      code: "B9",
      origin: "Bandung",
      destination: "Cianjur",
      createdAt: new Date(),
    } as any);

    const result = await createRoute({
      code: "B9",
      origin: "Bandung",
      destination: "Cianjur",
    });

    expect(result.code).toBe("B9");

    expect(prismaMock.route.create).toHaveBeenCalledWith({
      data: {
        code: "B9",
        origin: "Bandung",
        destination: "Cianjur",
      },
    });
  });
});

describe("route.service.getAllRoutes", () => {
  it("mengembalikan daftar rute terurut berdasarkan code", async () => {
    prismaMock.route.findMany.mockResolvedValueOnce([existingRoute] as any);

    const result = await getAllRoutes();

    expect(result).toEqual([existingRoute]);

    expect(prismaMock.route.findMany).toHaveBeenCalledWith({
      orderBy: { code: "asc" },
    });
  });
});

describe("route.service.deleteRoute", () => {
  it("memanggil prisma.route.delete dengan id yang benar", async () => {
    prismaMock.route.delete.mockResolvedValueOnce(existingRoute as any);

    await deleteRoute("route-1");

    expect(prismaMock.route.delete).toHaveBeenCalledWith({
      where: { id: "route-1" },
    });
  });
});
