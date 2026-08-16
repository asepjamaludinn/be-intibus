import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  generateDeviceToken,
  hashToken,
  timingSafeEqualHex,
  DUMMY_HASH,
} from "../utils/crypto.js";
import type { PairDevicePayload } from "../schema/device.schema.js";

export const redeemPairingCode = async (payload: PairDevicePayload) => {
  const { code, deviceId, deviceName } = payload;

  const rawToken = generateDeviceToken();
  const tokenHash = hashToken(rawToken);

  const result = await prisma.$transaction(async (tx) => {
    const pairing = await tx.pairingCode.findUnique({ where: { code } });

    if (!pairing || pairing.usedAt || pairing.expiresAt < new Date()) {
      throw new AppError(
        "Kode pairing tidak valid atau sudah kedaluwarsa",
        400,
      );
    }

    await tx.pairingCode.update({
      where: { id: pairing.id },
      data: { usedAt: new Date() },
    });

    const device = await tx.device.upsert({
      where: { deviceId },
      update: { tokenHash, revokedAt: null, name: deviceName },
      create: { deviceId, tokenHash, name: deviceName },
    });

    return device;
  });

  return { deviceId: result.deviceId, deviceToken: rawToken };
};

export const verifyDeviceToken = async (deviceId: string, token: string) => {
  const device = await prisma.device.findUnique({ where: { deviceId } });
  const providedHash = hashToken(token);
  const storedHash = device?.tokenHash ?? DUMMY_HASH;

  const isValid =
    !!device &&
    !device.revokedAt &&
    timingSafeEqualHex(providedHash, storedHash);

  if (!isValid) return null;

  void prisma.device
    .update({ where: { id: device.id }, data: { lastSeenAt: new Date() } })
    .catch((e) => console.error("Gagal update lastSeenAt device:", e));

  return device;
};
