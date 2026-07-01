import { Response, NextFunction } from "express";
import { Post } from "../models/Post";
import { sendPostToDiscord } from "../utils/discordWebhook";
import { env } from "../config/env";
import { BuyerTokenRequest } from "../middlewares/buyerTokenAuth";

// POST /api/integrations/trigger-post
// Dipanggil menggunakan token milik buyer sendiri (header x-buyer-token),
// agar setiap user/buyer bisa memicu auto-post instan dengan token mereka sendiri.
export async function triggerInstantPost(req: BuyerTokenRequest, res: Response, next: NextFunction) {
  try {
    const { title, content, imageUrl, webhookUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "title and content are required" });
    }

    const targetWebhook = webhookUrl || env.INTEGRATION_DEFAULT_WEBHOOK_URL;
    if (!targetWebhook) {
      return res.status(400).json({
        success: false,
        message: "webhookUrl is required (or set INTEGRATION_DEFAULT_WEBHOOK_URL in env)"
      });
    }

    // Simpan sebagai record Post juga, supaya tercatat di riwayat & dashboard admin
    const post = new Post({
      title,
      content,
      imageUrl,
      webhookUrl: targetWebhook,
      scheduledAt: new Date(),
      status: "scheduled",
      createdBy: req.buyerId ?? null
    });

    const result = await sendPostToDiscord(post);

    post.logs.push({
      attemptedAt: new Date(),
      status: result.success ? "success" : "error",
      message: `[Buyer: ${req.buyerUsername ?? "unknown"}] ${result.message}`
    });
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

// GET /api/integrations/ping — sanity check for buyer token setup
export async function pingIntegration(req: BuyerTokenRequest, res: Response) {
  return res.status(200).json({
    success: true,
    message: `Integration OK, authenticated as buyer "${req.buyerUsername}"`,
    timestamp: new Date().toISOString()
  });
}
