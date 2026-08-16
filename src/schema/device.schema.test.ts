import { describe, it, expect } from "vitest";
import {
  displayPayloadSchema,
  presetSchema,
  createRouteSchema,
} from "./display.schema.js";

const validPayload = {
  route: "B1 • Bandung - Garut",
  direction: "Pergi",
  animation: "Scroll Left",
  speed: 50,
  brightness: 80,
  fontSize: 16,
};

describe("displayPayloadSchema", () => {
  it("meloloskan payload yang valid", () => {
    const result = displayPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("menolak route kosong", () => {
    const result = displayPayloadSchema.safeParse({
      ...validPayload,
      route: "",
    });
    expect(result.success).toBe(false);
  });

  it("menolak direction selain 'Pergi'/'Pulang'", () => {
    const result = displayPayloadSchema.safeParse({
      ...validPayload,
      direction: "Sideways",
    });
    expect(result.success).toBe(false);
  });

  it("menolak animation yang tidak dikenal", () => {
    const result = displayPayloadSchema.safeParse({
      ...validPayload,
      animation: "Zoom In",
    });
    expect(result.success).toBe(false);
  });

  it("menolak speed di atas 100", () => {
    const result = displayPayloadSchema.safeParse({
      ...validPayload,
      speed: 150,
    });
    expect(result.success).toBe(false);
  });

  it("menolak speed negatif", () => {
    const result = displayPayloadSchema.safeParse({
      ...validPayload,
      speed: -1,
    });
    expect(result.success).toBe(false);
  });

  it("menolak brightness di atas 100", () => {
    const result = displayPayloadSchema.safeParse({
      ...validPayload,
      brightness: 101,
    });
    expect(result.success).toBe(false);
  });

  it("menolak fontSize di bawah 8", () => {
    const result = displayPayloadSchema.safeParse({
      ...validPayload,
      fontSize: 5,
    });
    expect(result.success).toBe(false);
  });

  it("menerima semua mode animasi yang didukung", () => {
    const modes = [
      "Running",
      "Static",
      "Blink",
      "Scroll Left",
      "Scroll Right",
      "Scroll Up",
      "Scroll Down",
    ];
    for (const animation of modes) {
      const result = displayPayloadSchema.safeParse({
        ...validPayload,
        animation,
      });
      expect(result.success, `mode "${animation}" seharusnya valid`).toBe(true);
    }
  });
});

describe("presetSchema", () => {
  it("meloloskan preset dengan nama dan payload valid", () => {
    const result = presetSchema.safeParse({
      name: "Preset Pagi",
      payload: validPayload,
    });
    expect(result.success).toBe(true);
  });

  it("name bersifat opsional", () => {
    const result = presetSchema.safeParse({ payload: validPayload });
    expect(result.success).toBe(true);
  });

  it("tetap menolak jika payload di dalamnya invalid", () => {
    const result = presetSchema.safeParse({
      name: "Preset Rusak",
      payload: { ...validPayload, speed: 999 },
    });
    expect(result.success).toBe(false);
  });
});

describe("createRouteSchema", () => {
  it("meloloskan data rute yang lengkap", () => {
    const result = createRouteSchema.safeParse({
      code: "B1",
      origin: "Bandung",
      destination: "Garut",
    });
    expect(result.success).toBe(true);
  });

  it("menolak jika code kosong", () => {
    const result = createRouteSchema.safeParse({
      code: "",
      origin: "Bandung",
      destination: "Garut",
    });
    expect(result.success).toBe(false);
  });

  it("menolak jika origin atau destination hilang", () => {
    const result = createRouteSchema.safeParse({
      code: "B1",
      origin: "Bandung",
    });
    expect(result.success).toBe(false);
  });
});
