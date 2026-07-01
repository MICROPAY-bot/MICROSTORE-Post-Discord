import cron from "node-cron";
import { BuyerConfig } from "../models/BuyerConfig";
import { sendChannelMessage } from "./discordBotSender";

const MAX_LOGS = 100;
let isRunning = false;

async function processRunningConfigs() {
  if (isRunning) return; // anti-overlap
  isRunning = true;

  try {
    const configs = await BuyerConfig.find({ status: "running" }).select("+discordToken");
    const now = new Date();

    for (const config of configs) {
      if (!config.discordToken || config.channels.length === 0) continue;

      let changed = false;

      for (const channel of config.channels) {
        const dueAt = channel.lastSentAt
          ? new Date(channel.lastSentAt.getTime() + channel.delayMinutes * 60 * 1000)
          : now;

        if (now < dueAt) continue;

        const result = await sendChannelMessage(
          config.discordToken,
          channel.channelId,
          config.messageContent,
          config.sendMode
        );

        channel.lastSentAt = new Date();
        changed = true;

        config.logs.push({
          at: new Date(),
          level: result.success ? "success" : "error",
          message: result.message
        });

        console.log(
          `[BUYER-AUTOPOST] buyer=${config.buyer} channel=${channel.channelId} -> ${
            result.success ? "OK" : "FAIL"
          } (${result.message})`
        );
      }

      if (changed) {
        if (config.logs.length > MAX_LOGS) config.logs = config.logs.slice(-MAX_LOGS);
        await config.save();
      }
    }
  } catch (error) {
    console.error("[BUYER-AUTOPOST] Error processing running configs:", error);
  } finally {
    isRunning = false;
  }
}

export function startBuyerAutoPosterScheduler() {
  // Cek tiap menit; tiap channel punya delay sendiri (dalam menit) yang dihormati lewat lastSentAt
  cron.schedule("* * * * *", processRunningConfigs);
  console.log("[BUYER-AUTOPOST] Scheduler started (runs every minute, per-channel delay)");
}
