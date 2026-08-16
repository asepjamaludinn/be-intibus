import "../src/config/env.js";
import { prisma } from "../src/utils/prisma.js";
import { generatePairingCode } from "../src/utils/crypto.js";

const EXPIRY_MINUTES = 15;

const main = async () => {
  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await prisma.pairingCode.create({ data: { code, expiresAt } });

  console.log("\nKODE PAIRING DEVICE");
  console.log(`Kode      : ${code}`);
  console.log(
    `Berlaku   : ${EXPIRY_MINUTES} menit (sampai ${expiresAt.toLocaleString()})`,
  );
  console.log(
    "Masukkan kode ini di layar pairing pada aplikasi Smart Bus Display.",
  );

  await prisma.$disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
