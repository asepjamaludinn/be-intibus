import mqtt from "mqtt";
import type { MqttClient } from "mqtt";
import type { DisplayPayload } from "../schema/display.schema.js";

let client: MqttClient | null = null;

const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com";
const TOPIC = "ptinti/bus/01/display";

export const connectMqtt = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`[MQTT] Menghubungkan ke broker ${MQTT_BROKER_URL}...`);
    client = mqtt.connect(MQTT_BROKER_URL);

    client.on("connect", () => {
      console.log("[MQTT] Berhasil terhubung ke broker HiveMQ");
      resolve();
    });

    client.on("error", (err) => {
      console.error("[MQTT] Koneksi error:", err);
      reject(err);
    });
  });
};

export const publishToDisplay = async (
  payload: DisplayPayload,
): Promise<void> => {
  if (!client || !client.connected) {
    console.warn("[MQTT] Klien tidak terhubung. Melewati pengiriman MQTT.");
    return;
  }

  const message = JSON.stringify(payload);
  client.publish(TOPIC, message, { qos: 1 }, (err) => {
    if (err) {
      console.error("[MQTT] Gagal mempublikasikan pesan:", err);
    } else {
      console.log(`[MQTT] Pesan terkirim ke topik '${TOPIC}':`, message);
    }
  });
};
