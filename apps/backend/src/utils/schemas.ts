import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100)
});

export const registerBuyerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z.string().min(6).max(100)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10)
});

export const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(4000),
  imageUrl: z.string().url().optional().or(z.literal("")),
  webhookUrl: z.string().url("webhookUrl harus berupa URL Discord webhook yang valid"),
  scheduledAt: z.string().min(1)
});

export const updatePostSchema = createPostSchema.partial().extend({
  status: z.enum(["draft", "scheduled", "posted", "failed", "cancelled"]).optional()
});

export const triggerPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(4000),
  imageUrl: z.string().url().optional().or(z.literal("")),
  webhookUrl: z.string().url().optional().or(z.literal(""))
});

export const channelConfigSchema = z.object({
  channelId: z.string().min(5).max(40),
  delayMinutes: z.number().int().min(1).max(1440)
});

export const saveBuyerConfigSchema = z.object({
  discordToken: z.string().max(500).optional().or(z.literal("")),
  sendMode: z.enum(["embed", "biasa"]).optional(),
  messageContent: z.string().max(4000).optional().or(z.literal("")),
  channels: z.array(channelConfigSchema).max(10).optional()
});
