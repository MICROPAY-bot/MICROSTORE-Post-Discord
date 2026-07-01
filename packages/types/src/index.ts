export type UserRole = "admin" | "buyer";

export interface AuthUserDTO {
  id: string;
  username: string;
  role: UserRole;
  buyerToken?: string;
}

export interface ActivityLogDTO {
  action: string;
  detail?: string;
  at: string;
}

export interface BuyerDTO {
  _id: string;
  username: string;
  buyerToken?: string;
  isActive: boolean;
  lastLoginAt?: string;
  licenseStatus: "active" | "expired";
  licenseExpiresAt?: string;
  activityLogs: ActivityLogDTO[];
  createdAt: string;
}

export type SendMode = "embed" | "biasa";
export type RunStatus = "running" | "stopped";

export interface ChannelConfigDTO {
  channelId: string;
  delayMinutes: number;
  lastSentAt?: string | null;
}

export interface ConfigLogDTO {
  at: string;
  level: "info" | "success" | "error";
  message: string;
}

export interface BuyerConfigDTO {
  sendMode: SendMode;
  messageContent: string;
  channels: ChannelConfigDTO[];
  status: RunStatus;
  discordTokenMasked: string;
  hasToken: boolean;
  licenseStatus: "active" | "expired";
  licenseExpiresAt: string | null;
  logs: ConfigLogDTO[];
}

export interface TriggerPostPayload {
  title: string;
  content: string;
  imageUrl?: string;
  webhookUrl?: string;
}

export interface LoginResponseDTO {
  token: string;
  user: AuthUserDTO;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export type PostStatus = "draft" | "scheduled" | "posted" | "failed" | "cancelled";

export interface PostLogDTO {
  attemptedAt: string;
  status: "success" | "error";
  message: string;
}

export interface PostDTO {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  webhookUrl: string;
  scheduledAt: string;
  status: PostStatus;
  postedAt?: string;
  logs: PostLogDTO[];
}
