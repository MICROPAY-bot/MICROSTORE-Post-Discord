import axios from "axios";
import { SendMode } from "../models/BuyerConfig";

interface SendResult {
  success: boolean;
  message: string;
}

// Mengirim pesan ke satu channel Discord memakai token milik buyer sendiri.
// Buyer mengisi token ini sendiri di panel (lihat IntegrationTokensPage / BuyerDashboard),
// jadi pengiriman dilakukan atas nama akun/bot milik buyer, bukan token sistem.
export async function sendChannelMessage(
  token: string,
  channelId: string,
  content: string,
  mode: SendMode
): Promise<SendResult> {
  if (!token) return { success: false, message: "Discord token belum diisi" };
  if (!channelId) return { success: false, message: "Channel ID kosong" };
  if (!content) return { success: false, message: "Isi pesan kosong" };

  const payload =
    mode === "embed"
      ? { embeds: [{ description: content, color: 0x00ffff, timestamp: new Date().toISOString() }] }
      : { content };

  try {
    await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, payload, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json"
      },
      timeout: 15000
    });
    return { success: true, message: `Terkirim ke channel ${channelId}` };
  } catch (error: any) {
    const reason =
      error?.response?.data?.message ?? error?.message ?? "Gagal mengirim pesan ke Discord";
    return { success: false, message: `Channel ${channelId}: ${reason}` };
  }
}
