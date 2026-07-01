import { connectDB } from "../config/db";
import { env } from "../config/env";
import { User } from "../models/User";
import mongoose from "mongoose";

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log("[SEED] Admin already exists:", existing.username);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    username: "admin",
    password: "admin123",
    role: "admin"
  });

  console.log("[SEED] Admin created -> username: admin | password: admin123");
  console.log("[SEED] Please change this password after first login!");
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("[SEED] Failed:", err);
  process.exit(1);
});
