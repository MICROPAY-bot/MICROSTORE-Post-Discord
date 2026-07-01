import mongoose, { Document, Schema } from "mongoose";

export type SendMode = "embed" | "biasa";
export type RunStatus = "running" | "stopped";

export interface IChannelConfig {
  channelId: string;
  delayMinutes: number;
  lastSentAt?: Date | null;
}

export interface IConfigLog {
  at: Date;
  level: "info" | "success" | "error";
  message: string;
}

export interface IBuyerConfig extends Document {
  buyer: mongoose.Types.ObjectId;
  discordToken: string;
  sendMode: SendMode;
  messageContent: string;
  channels: IChannelConfig[];
  status: RunStatus;
  logs: IConfigLog[];
  createdAt: Date;
  updatedAt: Date;
}

const channelConfigSchema = new Schema<IChannelConfig>(
  {
    channelId: { type: String, required: true, trim: true },
    delayMinutes: { type: Number, required: true, min: 1, max: 1440 },
    lastSentAt: { type: Date, default: null }
  },
  { _id: false }
);

const configLogSchema = new Schema<IConfigLog>(
  {
    at: { type: Date, default: Date.now },
    level: { type: String, enum: ["info", "success", "error"], required: true },
    message: { type: String, required: true }
  },
  { _id: false }
);

const buyerConfigSchema = new Schema<IBuyerConfig>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    discordToken: { type: String, default: "", select: false },
    sendMode: { type: String, enum: ["embed", "biasa"], default: "embed" },
    messageContent: { type: String, default: "" },
    channels: {
      type: [channelConfigSchema],
      default: [],
      validate: {
        validator: (arr: IChannelConfig[]) => arr.length <= 10,
        message: "Maksimal 10 channel"
      }
    },
    status: { type: String, enum: ["running", "stopped"], default: "stopped" },
    // Batasi log yang disimpan supaya dokumen tidak membengkak tak terbatas
    logs: { type: [configLogSchema], default: [] }
  },
  { timestamps: true }
);

export const BuyerConfig = mongoose.model<IBuyerConfig>("BuyerConfig", buyerConfigSchema);
