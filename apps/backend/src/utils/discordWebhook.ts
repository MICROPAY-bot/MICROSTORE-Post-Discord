import axios from "axios";
import { IPost } from "../models/Post";

interface SendResult {
  success: boolean;
  message: string;
}

export async function sendPostToDiscord(post: IPost): Promise<SendResult> {
  if (!post.webhookUrl) {
    return { success: false, message: "Webhook URL is not set" };
  }

  try {
    const embed: Record<string, unknown> = {
      title: post.title,
      description: post.content,
      color: 0x00ffff,
      timestamp: new Date().toISOString()
    };

    if (post.imageUrl) {
      embed.image = { url: post.imageUrl };
    }

    await axios.post(post.webhookUrl, {
      username: "MICROSTORE AUTO POST",
      embeds: [embed]
    });

    return { success: true, message: "Posted successfully to Discord webhook" };
  } catch (error: any) {
    const reason =
      error?.response?.data?.message ?? error?.message ?? "Unknown error sending to webhook";
    return { success: false, message: reason };
  }
}
