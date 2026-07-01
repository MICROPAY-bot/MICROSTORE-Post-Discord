import { Router } from "express";
import { env } from "../config/env";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: env.APP_NAME,
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

export default router;
