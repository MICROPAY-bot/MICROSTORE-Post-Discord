import axios from "axios";
import { env } from "../config/env";

export async function notifyLog(message: string): Promise<void> {
  if (!env.DISCORD_LOG_WEBHOOK_URL) return;

  try {
    await axios.post(env.DISCORD_LOG_WEBHOOK_URL, {
      username: "MICROSTORE AUTO POST [LOG]",
      content: message
    });
  } catch (error) {
    console.error("[LOG-NOTIFY] Failed to send log webhook:", error);
  }
}
