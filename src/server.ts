import "dotenv/config";

import { app } from "./app.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`[SERVER] Berjalan di http://localhost:${PORT}`);
      console.log(`[INFO] Mode API Sinkronisasi aktif Bluetooth Mode`);
    });
  } catch (error) {
    console.error("[SERVER] Gagal memulai server:", error);
    process.exit(1);
  }
};

startServer();
