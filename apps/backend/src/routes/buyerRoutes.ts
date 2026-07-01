import { Router } from "express";
import {
  getBuyers,
  getBuyerById,
  regenerateBuyerToken,
  toggleBuyerActive,
  deleteBuyer,
  updateBuyerLicense
} from "../controllers/buyerController";
import { authenticate, requireRole } from "../middlewares/auth";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/", getBuyers);
router.get("/:id", getBuyerById);
router.patch("/:id/regenerate-token", regenerateBuyerToken);
router.patch("/:id/toggle-active", toggleBuyerActive);
router.patch("/:id/license", updateBuyerLicense);
router.delete("/:id", deleteBuyer);

export default router;
