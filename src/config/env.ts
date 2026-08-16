import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL wajib diisi di file .env" })
    .url({
      message:
        "DATABASE_URL harus berupa connection string PostgreSQL yang valid",
    }),
  ALLOWED_ORIGINS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\nKONFIGURASI ENV TIDAK VALID ");
  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("Server dihentikan karena env tidak lengkap/salah.");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  allowedOriginsList: parsed.data.ALLOWED_ORIGINS
    ? parsed.data.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:3000"],
};
