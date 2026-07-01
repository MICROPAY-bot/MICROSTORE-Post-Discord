import cron from "node-cron";
import { Post } from "../models/Post";
import { sendPostToDiscord } from "../utils/discordWebhook";
import { notifyLog } from "../utils/logNotifier";

let isRunning = false;

async function processDuePosts() {
  if (isRunning) return; // prevent overlap if previous run is still going
  isRunning = true;

  try {
    const now = new Date();
    const duePosts = await Post.find({ status: "scheduled", scheduledAt: { $lte: now } });

    for (const post of duePosts) {
      const result = await sendPostToDiscord(post);

      post.logs.push({
        attemptedAt: new Date(),
        status: result.success ? "success" : "error",
        message: result.message
      });
      post.status = result.success ? "posted" : "failed";
      if (result.success) post.postedAt = new Date();

      await post.save();

      console.log(
        `[SCHEDULER] Post "${post.title}" -> ${result.success ? "POSTED" : "FAILED"} (${result.message})`
      );

      await notifyLog(
        `${result.success ? "✅" : "❌"} Auto Post **${post.title}** ${
          result.success ? "berhasil dikirim" : `gagal: ${result.message}`
        }`
      );
    }
  } catch (error) {
    console.error("[SCHEDULER] Error while processing due posts:", error);
  } finally {
    isRunning = false;
  }
}

export function startPostScheduler() {
  // Runs every minute
  cron.schedule("* * * * *", processDuePosts);
  console.log("[SCHEDULER] Auto-post scheduler started (runs every minute)");
}
