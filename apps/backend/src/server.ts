import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { startPostScheduler } from "./utils/scheduler";
import { startBuyerAutoPosterScheduler } from "./utils/buyerAutoPosterScheduler";

async function bootstrap() {
  await connectDB();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[SERVER] ${env.APP_NAME} running on port ${env.PORT} (${env.NODE_ENV})`);
    startPostScheduler();
    startBuyerAutoPosterScheduler();
  });
}

bootstrap().catch((err) => {
  console.error("[FATAL] Failed to start server:", err);
  process.exit(1);
});
