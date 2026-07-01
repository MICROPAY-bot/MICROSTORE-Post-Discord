import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/microstore",
  JWT_SECRET: process.env.JWT_SECRET ?? "change_this_secret",
  JWT_EXPIRE: process.env.JWT_EXPIRE ?? "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "change_this_refresh_secret",
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE ?? "30d",
  APP_NAME: process.env.APP_NAME ?? "MICROSTORE AUTO POST",
  INTEGRATION_DEFAULT_WEBHOOK_URL: process.env.INTEGRATION_DEFAULT_WEBHOOK_URL ?? "",
  DISCORD_LOG_WEBHOOK_URL: process.env.DISCORD_LOG_WEBHOOK_URL ?? ""
};
