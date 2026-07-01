import { Response, NextFunction } from "express";
import { BuyerConfig } from "../models/BuyerConfig";
import { User } from "../models/User";
import { AuthRequest } from "../middlewares/auth";

const MAX_LOGS = 100;

async function getOrCreateConfig(buyerId: string) {
  let config = await BuyerConfig.findOne({ buyer: buyerId }).select("+discordToken");
  if (!config) {
    config = await BuyerConfig.create({ buyer: buyerId });
    config = await BuyerConfig.findById(config._id).select("+discordToken");
  }
  return config!;
}

function maskToken(token?: string) {
  if (!token) return "";
  if (token.length <= 8) return "••••••••";
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}

// GET /api/buyer-config/me
export async function getMyConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const config = await getOrCreateConfig(req.user!.id);
    const user = await User.findById(req.user!.id).select("licenseStatus licenseExpiresAt");

    return res.status(200).json({
      success: true,
      data: {
        sendMode: config.sendMode,
        messageContent: config.messageContent,
        channels: config.channels,
        status: config.status,
        discordTokenMasked: maskToken(config.discordToken),
        hasToken: Boolean(config.discordToken),
        licenseStatus: user?.licenseStatus ?? "active",
        licenseExpiresAt: user?.licenseExpiresAt ?? null,
        logs: config.logs.slice(-MAX_LOGS).reverse()
      }
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/buyer-config/me — buyer mengisi token Discord miliknya sendiri di sini
export async function saveMyConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { discordToken, sendMode, messageContent, channels } = req.body;

    const config = await getOrCreateConfig(req.user!.id);

    if (discordToken !== undefined && discordToken !== "") {
      config.discordToken = discordToken;
    }
    if (sendMode !== undefined) config.sendMode = sendMode;
    if (messageContent !== undefined) config.messageContent = messageContent;
    if (channels !== undefined) {
      if (channels.length > 10) {
        return res.status(400).json({ success: false, message: "Maksimal 10 channel" });
      }
      config.channels = channels.map((c: any) => ({
        channelId: String(c.channelId).trim(),
        delayMinutes: Number(c.delayMinutes),
        lastSentAt: null
      }));
    }

    config.logs.push({ at: new Date(), level: "info", message: "Konfigurasi disimpan" });
    if (config.logs.length > MAX_LOGS) config.logs = config.logs.slice(-MAX_LOGS);

    await config.save();

    return res.status(200).json({ success: true, message: "Konfigurasi berhasil disimpan" });
  } catch (err) {
    next(err);
  }
}

// POST /api/buyer-config/me/start
export async function startMyConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const config = await getOrCreateConfig(req.user!.id);

    if (!config.discordToken) {
      return res.status(400).json({ success: false, message: "Isi Discord Token terlebih dahulu" });
    }
    if (config.channels.length === 0) {
      return res.status(400).json({ success: false, message: "Tambahkan minimal 1 channel" });
    }

    const user = await User.findById(req.user!.id).select("licenseStatus");
    if (user?.licenseStatus === "expired") {
      return res.status(403).json({ success: false, message: "Lisensi Anda sudah expired, hubungi admin" });
    }

    config.status = "running";
    config.logs.push({ at: new Date(), level: "success", message: "Auto post dijalankan (RUNNING)" });
    if (config.logs.length > MAX_LOGS) config.logs = config.logs.slice(-MAX_LOGS);
    await config.save();

    return res.status(200).json({ success: true, message: "Status: RUNNING" });
  } catch (err) {
    next(err);
  }
}

// POST /api/buyer-config/me/stop
export async function stopMyConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const config = await getOrCreateConfig(req.user!.id);
    config.status = "stopped";
    config.logs.push({ at: new Date(), level: "info", message: "Auto post dihentikan (STOP)" });
    if (config.logs.length > MAX_LOGS) config.logs = config.logs.slice(-MAX_LOGS);
    await config.save();

    return res.status(200).json({ success: true, message: "Status: STOP" });
  } catch (err) {
    next(err);
  }
}

// GET /api/buyer-config/me/logs — dipakai live log auto (polling)
export async function getMyLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const config = await BuyerConfig.findOne({ buyer: req.user!.id });
    return res.status(200).json({
      success: true,
      data: {
        status: config?.status ?? "stopped",
        logs: (config?.logs ?? []).slice(-MAX_LOGS).reverse()
      }
    });
  } catch (err) {
    next(err);
  }
}
