import { Router } from "express";
import { triggerInstantPost, pingIntegration } from "../controllers/integrationController";
import { buyerTokenAuth } from "../middlewares/buyerTokenAuth";
import { integrationLimiter } from "../middlewares/rateLimit";
import { validateBody } from "../middlewares/validate";
import { triggerPostSchema } from "../utils/schemas";

const router = Router();

router.use(buyerTokenAuth, integrationLimiter);

router.get("/ping", pingIntegration);
router.post("/trigger-post", validateBody(triggerPostSchema), triggerInstantPost);

export default router;
