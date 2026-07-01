import { Router } from "express";
import {
  getMyConfig,
  saveMyConfig,
  startMyConfig,
  stopMyConfig,
  getMyLogs
} from "../controllers/buyerConfigController";
import { authenticate, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { saveBuyerConfigSchema } from "../utils/schemas";

const router = Router();

router.use(authenticate, requireRole("buyer"));

router.get("/me", getMyConfig);
router.put("/me", validateBody(saveBuyerConfigSchema), saveMyConfig);
router.post("/me/start", startMyConfig);
router.post("/me/stop", stopMyConfig);
router.get("/me/logs", getMyLogs);

export default router;
