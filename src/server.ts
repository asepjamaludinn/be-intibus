import { env } from "./config/env.js";
import { app } from "./app.js";

const startServer = async () => {
  try {
    app.listen(env.PORT, () => {
      console.log(
        `[SERVER] Berjalan di http://localhost:${env.PORT} (${env.NODE_ENV})`,
      );
      console.log(`[INFO] Mode API Sinkronisasi aktif Bluetooth Mode`);
    });
  } catch (error) {
    console.error("[SERVER] Gagal memulai server:", error);
    process.exit(1);
  }
};

startServer();
