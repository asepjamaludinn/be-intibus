import { z } from "zod";

export const pairDeviceSchema = z.object({
  code: z
    .string({ required_error: "Kode pairing wajib diisi" })
    .trim()
    .min(6, "Kode pairing tidak valid"),
  deviceId: z
    .string({ required_error: "Device ID wajib diisi" })
    .uuid("Device ID harus berupa UUID yang valid"),
  deviceName: z.string().trim().max(100).optional(),
});

export type PairDevicePayload = z.infer<typeof pairDeviceSchema>;
