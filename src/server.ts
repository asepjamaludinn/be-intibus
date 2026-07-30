import { app } from "./app.js";
import { connectMqtt } from "./services/mqtt.service.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectMqtt();

    app.listen(PORT, () => {
      console.log(`[SERVER] Berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[SERVER] Gagal memulai server:", error);
    process.exit(1);
  }
};

startServer();
