import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

vi.mock("../utils/prisma.js", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep() };
});

import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/AppError.js";
import { hashToken } from "../utils/crypto.js";
import { redeemPairingCode, verifyDeviceToken } from "./device.service.js";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const TEST_DEVICE_ID = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => {
  mockReset(prismaMock);

  prismaMock.$transaction.mockImplementation(async (callback: any) =>
    callback(prismaMock),
  );
});

describe("device.service.redeemPairingCode", () => {
  it("menolak (AppError 400) ketika kode pairing tidak ditemukan", async () => {
    prismaMock.pairingCode.findUnique.mockResolvedValueOnce(null);

    await expect(
      redeemPairingCode({ code: "TIDAKADA", deviceId: TEST_DEVICE_ID }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(prismaMock.device.upsert).not.toHaveBeenCalled();
  });

  it("menolak ketika kode pairing sudah pernah dipakai (usedAt terisi)", async () => {
    prismaMock.pairingCode.findUnique.mockResolvedValueOnce({
      id: "p1",
      code: "ABCDEFGH",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    } as any);

    await expect(
      redeemPairingCode({ code: "ABCDEFGH", deviceId: TEST_DEVICE_ID }),
    ).rejects.toBeInstanceOf(AppError);

    expect(prismaMock.device.upsert).not.toHaveBeenCalled();
  });

  it("menolak ketika kode pairing sudah kedaluwarsa", async () => {
    prismaMock.pairingCode.findUnique.mockResolvedValueOnce({
      id: "p1",
      code: "ABCDEFGH",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    } as any);

    await expect(
      redeemPairingCode({ code: "ABCDEFGH", deviceId: TEST_DEVICE_ID }),
    ).rejects.toBeInstanceOf(AppError);

    expect(prismaMock.device.upsert).not.toHaveBeenCalled();
  });

  it("menandai kode sebagai used dan membuat device dengan token TER-HASH (bukan plain text)", async () => {
    prismaMock.pairingCode.findUnique.mockResolvedValueOnce({
      id: "p1",
      code: "ABCDEFGH",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    } as any);

    prismaMock.pairingCode.update.mockResolvedValueOnce({} as any);

    prismaMock.device.upsert.mockResolvedValueOnce({
      id: "d1",
      deviceId: TEST_DEVICE_ID,
      tokenHash: "placeholder",
      name: "Tablet A",
      createdAt: new Date(),
      lastSeenAt: null,
      revokedAt: null,
    } as any);

    const result = await redeemPairingCode({
      code: "ABCDEFGH",
      deviceId: TEST_DEVICE_ID,
      deviceName: "Tablet A",
    });

    expect(result.deviceToken).toMatch(/^[0-9a-f]{64}$/);
    expect(result.deviceId).toBe(TEST_DEVICE_ID);

    expect(prismaMock.pairingCode.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { usedAt: expect.any(Date) },
    });

    const upsertArgs = prismaMock.device.upsert.mock.calls[0][0] as any;

    expect(upsertArgs.create.tokenHash).toBe(hashToken(result.deviceToken));

    expect(upsertArgs.create.tokenHash).not.toBe(result.deviceToken);
  });

  it("me-reset revokedAt menjadi null ketika device yang sama dipasangkan ulang (re-pairing)", async () => {
    prismaMock.pairingCode.findUnique.mockResolvedValueOnce({
      id: "p1",
      code: "ABCDEFGH",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    } as any);

    prismaMock.pairingCode.update.mockResolvedValueOnce({} as any);
    prismaMock.device.upsert.mockResolvedValueOnce({} as any);

    await redeemPairingCode({
      code: "ABCDEFGH",
      deviceId: TEST_DEVICE_ID,
    });

    const upsertArgs = prismaMock.device.upsert.mock.calls[0][0] as any;

    expect(upsertArgs.update.revokedAt).toBeNull();
  });
});

describe("device.service.verifyDeviceToken", () => {
  it("mengembalikan null ketika device tidak ditemukan (tanpa throw)", async () => {
    prismaMock.device.findUnique.mockResolvedValueOnce(null);

    const result = await verifyDeviceToken(
      "device-tidak-ada",
      "sembarang-token",
    );

    expect(result).toBeNull();
  });

  it("mengembalikan null ketika device sudah di-revoke, meski token benar", async () => {
    const token = "token-benar-123";

    prismaMock.device.findUnique.mockResolvedValueOnce({
      id: "d1",
      deviceId: TEST_DEVICE_ID,
      tokenHash: hashToken(token),
      name: null,
      createdAt: new Date(),
      lastSeenAt: null,
      revokedAt: new Date(),
    } as any);

    const result = await verifyDeviceToken(TEST_DEVICE_ID, token);

    expect(result).toBeNull();
  });

  it("mengembalikan null ketika token salah", async () => {
    prismaMock.device.findUnique.mockResolvedValueOnce({
      id: "d1",
      deviceId: TEST_DEVICE_ID,
      tokenHash: hashToken("token-yang-benar"),
      name: null,
      createdAt: new Date(),
      lastSeenAt: null,
      revokedAt: null,
    } as any);

    const result = await verifyDeviceToken(TEST_DEVICE_ID, "token-yang-salah");

    expect(result).toBeNull();
  });

  it("mengembalikan device dan memperbarui lastSeenAt ketika token cocok", async () => {
    const token = "token-yang-benar";

    prismaMock.device.findUnique.mockResolvedValueOnce({
      id: "d1",
      deviceId: TEST_DEVICE_ID,
      tokenHash: hashToken(token),
      name: "Tablet A",
      createdAt: new Date(),
      lastSeenAt: null,
      revokedAt: null,
    } as any);

    prismaMock.device.update.mockResolvedValueOnce({} as any);

    const result = await verifyDeviceToken(TEST_DEVICE_ID, token);

    expect(result?.deviceId).toBe(TEST_DEVICE_ID);

    expect(prismaMock.device.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { lastSeenAt: expect.any(Date) },
    });
  });
});
