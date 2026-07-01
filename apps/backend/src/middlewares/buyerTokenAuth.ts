import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export interface BuyerTokenRequest extends Request {
  buyerId?: string;
  buyerUsername?: string;
}

// Autentikasi berbasis token milik buyer sendiri (bukan API key bersama admin).
// Header: x-buyer-token: <buyerToken milik user>
export async function buyerTokenAuth(req: BuyerTokenRequest, res: Response, next: NextFunction) {
  const token = req.headers["x-buyer-token"];

  if (!token || typeof token !== "string") {
    return res.status(401).json({ success: false, message: "Missing x-buyer-token header" });
  }

  try {
    const buyer = await User.findOne({ buyerToken: token, role: "buyer" });

    if (!buyer) {
      return res.status(401).json({ success: false, message: "Buyer token tidak valid" });
    }

    if (!buyer.isActive) {
      return res.status(403).json({ success: false, message: "Akun buyer ini telah dinonaktifkan" });
    }

    buyer.activityLogs.push({ action: "integration-call", at: new Date() });
    await buyer.save();

    req.buyerId = String(buyer._id);
    req.buyerUsername = buyer.username;
    next();
  } catch {
    return res.status(500).json({ success: false, message: "Gagal memvalidasi buyer token" });
  }
}
