import mongoose, { Document, Schema } from "mongoose";

export type PostStatus = "draft" | "scheduled" | "posted" | "failed" | "cancelled";

export interface IPostLog {
  attemptedAt: Date;
  status: "success" | "error";
  message: string;
}

export interface IPost extends Document {
  title: string;
  content: string;
  imageUrl?: string;
  webhookUrl: string;
  scheduledAt: Date;
  status: PostStatus;
  createdBy: mongoose.Types.ObjectId | null;
  postedAt?: Date;
  logs: IPostLog[];
  createdAt: Date;
  updatedAt: Date;
}

const postLogSchema = new Schema<IPostLog>(
  {
    attemptedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["success", "error"], required: true },
    message: { type: String, required: true }
  },
  { _id: false }
);

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
    webhookUrl: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "posted", "failed", "cancelled"],
      default: "scheduled"
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },
    postedAt: { type: Date, default: null },
    logs: { type: [postLogSchema], default: [] }
  },
  { timestamps: true }
);

postSchema.index({ status: 1, scheduledAt: 1 });

export const Post = mongoose.model<IPost>("Post", postSchema);
