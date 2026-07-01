import { createApp } from "../app";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";

export const app = createApp();

export async function createAdminUser(username = "admin_test", password = "admin123456") {
  const admin = await User.create({ username, password, role: "admin" });
  const token = signToken({ id: String(admin._id), username: admin.username, role: "admin" });
  return { admin, token };
}

export async function createBuyerUser(username = "buyer_test", password = "buyer123456") {
  const buyer = await User.create({
    username,
    password,
    role: "buyer",
    buyerToken: `MS-TEST-${Date.now()}`
  });
  const token = signToken({ id: String(buyer._id), username: buyer.username, role: "buyer" });
  return { buyer, token };
}
