import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "buyer";
export type LicenseStatus = "active" | "expired";

export interface IActivityLog {
  action: string;
  detail?: string;
  at: Date;
}

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserRole;
  buyerToken?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  refreshToken?: string | null;
  licenseStatus: LicenseStatus;
  licenseExpiresAt?: Date | null;
  activityLogs: IActivityLog[];
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true },
    detail: { type: String },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "buyer"], required: true, default: "buyer" },
    buyerToken: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    refreshToken: { type: String, default: null, select: false },
    licenseStatus: { type: String, enum: ["active", "expired"], default: "active" },
    licenseExpiresAt: { type: Date, default: null },
    activityLogs: { type: [activityLogSchema], default: [] }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
