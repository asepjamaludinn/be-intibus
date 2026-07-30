import { z } from "zod";

export const displayPayloadSchema = z.object({
  route: z.string().min(1, "Route tidak boleh kosong"),
  direction: z.enum(["Pergi", "Pulang"], {
    required_error: "Direction wajib diisi",
  }),
  animation: z.string({ required_error: "Animation wajib diisi" }),
  speed: z.number().min(0).max(100, "Speed maksimal 100"),
  brightness: z.number().min(0).max(100, "Brightness maksimal 100"),
  fontSize: z.number().min(8, "Font size terlalu kecil"),
});

export const presetSchema = z.object({
  name: z.string().optional(),
  payload: displayPayloadSchema,
});

export const createRouteSchema = z.object({
  code: z.string().min(1, "Kode rute wajib diisi (Contoh: B1)"),
  origin: z.string().min(1, "Kota asal wajib diisi"),
  destination: z.string().min(1, "Kota tujuan wajib diisi"),
});

export type DisplayPayload = z.infer<typeof displayPayloadSchema>;
export type CreateRoutePayload = z.infer<typeof createRouteSchema>;
