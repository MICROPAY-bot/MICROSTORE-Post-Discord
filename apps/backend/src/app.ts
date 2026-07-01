import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes";
import healthRoutes from "./routes/healthRoutes";
import postRoutes from "./routes/postRoutes";
import buyerRoutes from "./routes/buyerRoutes";
import integrationRoutes from "./routes/integrationRoutes";
import buyerConfigRoutes from "./routes/buyerConfigRoutes";
import { notFound, errorHandler } from "./middlewares/errorHandler";
import { apiLimiter } from "./middlewares/rateLimit";
import { logger } from "./utils/logger";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(
    morgan("dev", {
      stream: { write: (msg: string) => logger.http(msg.trim()) }
    })
  );
  app.use("/api", apiLimiter);

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/buyers", buyerRoutes);
  app.use("/api/integrations", integrationRoutes);
  app.use("/api/buyer-config", buyerConfigRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
