import { describe, it, expect } from "vitest";
import { pairDeviceSchema } from "./device.schema.js";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("pairDeviceSchema", () => {
  it("meloloskan data pairing yang valid lengkap dengan deviceName", () => {
    const result = pairDeviceSchema.safeParse({
      code: "A7XK2P9Q",
      deviceId: VALID_UUID,
      deviceName: "Tablet Kondektur B1",
    });
    expect(result.success).toBe(true);
  });

  it("deviceName bersifat opsional", () => {
    const result = pairDeviceSchema.safeParse({
      code: "A7XK2P9Q",
      deviceId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("menolak code lebih pendek dari 6 karakter", () => {
    const result = pairDeviceSchema.safeParse({
      code: "ABC",
      deviceId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("menolak deviceId yang bukan format UUID", () => {
    const result = pairDeviceSchema.safeParse({
      code: "A7XK2P9Q",
      deviceId: "bukan-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("men-trim whitespace pada code", () => {
    const result = pairDeviceSchema.safeParse({
      code: "  A7XK2P9Q  ",
      deviceId: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("A7XK2P9Q");
    }
  });

  it("menolak deviceName lebih dari 100 karakter", () => {
    const result = pairDeviceSchema.safeParse({
      code: "A7XK2P9Q",
      deviceId: VALID_UUID,
      deviceName: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});
