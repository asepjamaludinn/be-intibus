import type { DisplayPayload } from "../schema/display.schema.js";
import { prisma } from "../utils/prisma.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";

const STATE_ID = "CURRENT_STATE";

export const updateDisplayState = async (
  payload: DisplayPayload,
): Promise<DisplayPayload> => {
  console.log("\n[STATE] Menyimpan state terakhir di Database (PostgreSQL)...");

  const updatedState = await prisma.displayState.upsert({
    where: { id: STATE_ID },
    update: { payload: payload as Prisma.InputJsonValue },
    create: {
      id: STATE_ID,
      payload: payload as Prisma.InputJsonValue,
    },
  });

  return updatedState.payload as unknown as DisplayPayload;
};

export const getDisplayStatus = async () => {
  const stateRecord = await prisma.displayState.findUnique({
    where: { id: STATE_ID },
  });

  return {
    connected: true,
    ip: "API Sync Server",
    currentState: stateRecord
      ? (stateRecord.payload as unknown as DisplayPayload)
      : null,
  };
};

export const createPreset = async (
  name: string | undefined,
  payload: DisplayPayload,
) => {
  const presetName = name?.trim() || `Preset ${Date.now()}`;

  const existing = await prisma.preset.findFirst({
    where: {
      name: {
        equals: presetName,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new AppError(
      `Nama preset "${presetName}" sudah terdaftar. Gunakan nama lain.`,
      409,
    );
  }

  return await prisma.preset.create({
    data: {
      name: presetName,
      payload: payload as Prisma.InputJsonValue,
    },
  });
};

export const updatePreset = async (
  id: string,
  name: string | undefined,
  payload: DisplayPayload,
) => {
  const presetName = name?.trim() || `Preset ${Date.now()}`;

  const existing = await prisma.preset.findFirst({
    where: {
      name: {
        equals: presetName,
        mode: "insensitive",
      },
      NOT: { id },
    },
  });

  if (existing) {
    throw new AppError(
      `Nama preset "${presetName}" sudah dipakai oleh preset lain. Gunakan nama lain.`,
      409,
    );
  }

  return await prisma.preset.update({
    where: { id },
    data: {
      name: presetName,
      payload: payload as Prisma.InputJsonValue,
    },
  });
};

export const getAllPresets = async () => {
  return await prisma.preset.findMany({
    orderBy: { createdAt: "desc" },
  });
};
