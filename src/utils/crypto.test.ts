import { describe, it, expect } from "vitest";
import {
  generateDeviceToken,
  generatePairingCode,
  hashToken,
  timingSafeEqualHex,
  DUMMY_HASH,
} from "./crypto.js";

describe("generateDeviceToken", () => {
  it("menghasilkan token hex sepanjang 64 karakter (32 byte)", () => {
    const token = generateDeviceToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("selalu menghasilkan nilai yang berbeda setiap dipanggil", () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateDeviceToken()),
    );
    expect(tokens.size).toBe(50);
  });
});

describe("generatePairingCode", () => {
  it("menghasilkan kode sepanjang 8 karakter", () => {
    const code = generatePairingCode();
    expect(code).toHaveLength(8);
  });

  it("tidak mengandung karakter ambigu (0, O, 1, I)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generatePairingCode();
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it("hanya berisi huruf besar dan angka", () => {
    const code = generatePairingCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });
});

describe("hashToken", () => {
  it("menghasilkan hash SHA-256 (64 karakter hex) yang konsisten untuk input sama", () => {
    const hash1 = hashToken("my-secret-token");
    const hash2 = hashToken("my-secret-token");

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("menghasilkan hash berbeda untuk input berbeda", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("tidak pernah mengembalikan token asli sebagai bagian dari hash", () => {
    const secret = "super-rahasia-jangan-bocor";
    const hash = hashToken(secret);

    expect(hash).not.toContain(secret);
  });
});

describe("timingSafeEqualHex", () => {
  it("mengembalikan true untuk dua hash hex yang identik", () => {
    const hash = hashToken("token-sama");
    expect(timingSafeEqualHex(hash, hash)).toBe(true);
  });

  it("mengembalikan false untuk dua hash yang berbeda", () => {
    const hashA = hashToken("token-a");
    const hashB = hashToken("token-b");
    expect(timingSafeEqualHex(hashA, hashB)).toBe(false);
  });

  it("mengembalikan false (bukan throw) ketika salah satu input bukan hex valid", () => {
    expect(timingSafeEqualHex("not-valid-hex!!", hashToken("x"))).toBe(false);
  });

  it("mengembalikan false ketika panjang buffer berbeda, tanpa membocorkan lewat exception", () => {
    expect(() => timingSafeEqualHex("ab", hashToken("x"))).not.toThrow();
    expect(timingSafeEqualHex("ab", hashToken("x"))).toBe(false);
  });

  it("DUMMY_HASH adalah hash SHA-256 valid sepanjang 64 karakter (untuk padding constant-time)", () => {
    expect(DUMMY_HASH).toMatch(/^[0-9a-f]{64}$/);
  });
});
