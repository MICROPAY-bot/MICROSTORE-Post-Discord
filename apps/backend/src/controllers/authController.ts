import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { signToken, signRefreshToken, verifyRefreshToken, generateBuyerToken } from "../utils/jwt";
import { AuthRequest } from "../middlewares/auth";
import { logger } from "../utils/logger";

// POST /api/auth/register-buyer
export async function registerBuyer(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }

    const buyer = await User.create({
      username,
      password,
      role: "buyer",
      buyerToken: generateBuyerToken(),
      activityLogs: [{ action: "register", at: new Date() }]
    });

    return res.status(201).json({
      success: true,
      message: "Buyer registered successfully",
      data: { id: buyer._id, username: buyer.username, buyerToken: buyer.buyerToken }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login (shared by admin & buyer)
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Akun ini telah dinonaktifkan oleh admin" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    user.lastLoginAt = new Date();
    user.activityLogs.push({ action: "login", at: new Date() });

    const token = signToken({ id: String(user._id), username: user.username, role: user.role });
    const refreshToken = signRefreshToken({ id: String(user._id), username: user.username, role: user.role });
    user.refreshToken = refreshToken;
    await user.save();

    logger.info("User logged in", { username: user.username, role: user.role });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          buyerToken: user.role === "buyer" ? user.buyerToken : undefined
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "refreshToken is required" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: "Refresh token tidak valid atau sudah expired" });
    }

    const user = await User.findById(payload.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token tidak dikenali (mungkin sudah di-logout)" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Akun ini telah dinonaktifkan" });
    }

    const newToken = signToken({ id: String(user._id), username: user.username, role: user.role });
    const newRefreshToken = signRefreshToken({ id: String(user._id), username: user.username, role: user.role });
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { token: newToken, refreshToken: newRefreshToken }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (user) {
      user.refreshToken = null;
      user.activityLogs.push({ action: "logout", at: new Date() });
      await user.save();
    }
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/buyer-token (buyer only)
export async function getBuyerToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.role !== "buyer") {
      return res.status(403).json({ success: false, message: "Only buyers have a buyer token" });
    }

    if (!user.buyerToken) {
      user.buyerToken = generateBuyerToken();
      await user.save();
    }

    return res.status(200).json({ success: true, data: { buyerToken: user.buyerToken } });
  } catch (err) {
    next(err);
  }
}
