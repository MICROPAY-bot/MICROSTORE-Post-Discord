import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const skipInTest = () => env.NODE_ENV === "test";

// Strict limiter for auth endpoints (login/register) to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: "Terlalu banyak percobaan. Silakan coba lagi nanti."
  }
});

// General limiter for normal API usage
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: "Terlalu banyak request. Silakan perlambat."
  }
});

// Limiter for integration endpoints (keyed by buyer token, generous but bounded)
export const integrationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  keyGenerator: (req) => (req.headers["x-buyer-token"] as string) || req.ip || "unknown",
  message: {
    success: false,
    message: "Rate limit tercapai untuk token ini."
  }
});
