import { Router } from "express";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  cancelPost,
  postNow
} from "../controllers/postController";
import { authenticate, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { createPostSchema, updatePostSchema } from "../utils/schemas";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.post("/", validateBody(createPostSchema), createPost);
router.get("/", getPosts);
router.get("/:id", getPostById);
router.put("/:id", validateBody(updatePostSchema), updatePost);
router.delete("/:id", deletePost);
router.patch("/:id/cancel", cancelPost);
router.post("/:id/post-now", postNow);

export default router;
