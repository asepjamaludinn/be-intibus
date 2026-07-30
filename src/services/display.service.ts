import type { DisplayPayload } from "../schema/display.schema.js";
import { publishToDisplay } from "./mqtt.service.js";
import { prisma } from "../utils/prisma.js";

let currentDisplayState: DisplayPayload | null = null;

export const updateDisplayState = async (
  payload: DisplayPayload,
): Promise<DisplayPayload> => {
  currentDisplayState = payload;
  console.log("\n[STATE] Memperbarui State Internal Server...");
  await publishToDisplay(payload);
  return currentDisplayState;
};

export const getDisplayStatus = () => {
  return {
    connected: true,
    ip: "192.168.1.100",
    currentState: currentDisplayState,
  };
};

export const createPreset = async (
  name: string | undefined,
  payload: DisplayPayload,
) => {
  return await prisma.preset.create({
    data: {
      name: name || `Preset ${Date.now()}`,
      payload: payload as any,
    },
  });
};

export const getAllPresets = async () => {
  return await prisma.preset.findMany({
    orderBy: { createdAt: "desc" },
  });
};
