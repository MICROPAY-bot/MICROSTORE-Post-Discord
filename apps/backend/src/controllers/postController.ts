import { Response, NextFunction } from "express";
import { Post } from "../models/Post";
import { AuthRequest } from "../middlewares/auth";
import { sendPostToDiscord } from "../utils/discordWebhook";

// POST /api/posts (admin only)
export async function createPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, content, imageUrl, webhookUrl, scheduledAt } = req.body;

    if (!title || !content || !webhookUrl || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "title, content, webhookUrl, and scheduledAt are required"
      });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid scheduledAt date" });
    }

    const post = await Post.create({
      title,
      content,
      imageUrl,
      webhookUrl,
      scheduledAt: scheduledDate,
      status: "scheduled",
      createdBy: req.user?.id
    });

    return res.status(201).json({ success: true, message: "Post scheduled", data: post });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts (admin only) — supports ?status=
export async function getPosts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const posts = await Post.find(filter).sort({ scheduledAt: -1 }).populate("createdBy", "username");
    return res.status(200).json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id (admin only)
export async function getPostById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findById(req.params.id).populate("createdBy", "username");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

// PUT /api/posts/:id (admin only) — only editable if not yet posted
export async function updatePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.status === "posted") {
      return res.status(400).json({ success: false, message: "Cannot edit a post that is already posted" });
    }

    const { title, content, imageUrl, webhookUrl, scheduledAt, status } = req.body;

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;
    if (webhookUrl !== undefined) post.webhookUrl = webhookUrl;
    if (scheduledAt !== undefined) {
      const scheduledDate = new Date(scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid scheduledAt date" });
      }
      post.scheduledAt = scheduledDate;
    }
    if (status !== undefined) post.status = status;

    await post.save();
    return res.status(200).json({ success: true, message: "Post updated", data: post });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id (admin only)
export async function deletePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/posts/:id/cancel (admin only)
export async function cancelPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    if (post.status === "posted") {
      return res.status(400).json({ success: false, message: "Cannot cancel a post already posted" });
    }
    post.status = "cancelled";
    await post.save();
    return res.status(200).json({ success: true, message: "Post cancelled", data: post });
  } catch (err) {
    next(err);
  }
}

// POST /api/posts/:id/post-now (admin only) — manual trigger, bypass schedule
export async function postNow(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    if (post.status === "posted") {
      return res.status(400).json({ success: false, message: "Post already posted" });
    }

    const result = await sendPostToDiscord(post);

    post.logs.push({ attemptedAt: new Date(), status: result.success ? "success" : "error", message: result.message });
    post.status = result.success ? "posted" : "failed";
    if (result.success) post.postedAt = new Date();
    await post.save();

    return res.status(result.success ? 200 : 502).json({
      success: result.success,
      message: result.message,
      data: post
    });
  } catch (err) {
    next(err);
  }
}
