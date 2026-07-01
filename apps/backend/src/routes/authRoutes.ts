import { Router } from "express";
import { registerBuyer, login, getProfile, getBuyerToken, refresh, logout } from "../controllers/authController";
import { authenticate, requireRole } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimit";
import { validateBody } from "../middlewares/validate";
import { loginSchema, registerBuyerSchema, refreshTokenSchema } from "../utils/schemas";

const router = Router();

router.post("/register-buyer", authLimiter, validateBody(registerBuyerSchema), registerBuyer);
router.post("/login", authLimiter, validateBody(loginSchema), login);
router.post("/refresh", authLimiter, validateBody(refreshTokenSchema), refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getProfile);
router.get("/buyer-token", authenticate, requireRole("buyer"), getBuyerToken);

export default router;
