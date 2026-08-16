import crypto from "node:crypto";

const TOKEN_BYTES = 32;
const PAIRING_CODE_LENGTH = 8;

export const generateDeviceToken = (): string =>
  crypto.randomBytes(TOKEN_BYTES).toString("hex");

export const generatePairingCode = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(PAIRING_CODE_LENGTH);
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
};

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token, "utf8").digest("hex");

export const timingSafeEqualHex = (a: string, b: string): boolean => {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

export const DUMMY_HASH = hashToken("dummy-constant-time-padding");
