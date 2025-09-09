// api/telegram/webhook.js
const WEBAPP_URL = process.env.WEBAPP_URL || "https://<DOMAIN-KAMU>.vercel.app";

async function sendMessage(token, chatId, payload) {
  // Node 18+ sudah punya fetch
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, ...payload })
  });
}

module.exports = async (req, res) => {
  try {
    // Balas 200 utk semua method agar Telegram gak retry kalau sekadar ping
    if (req.method !== "POST") return res.status(200).json({ ok: true });

    // Pastikan body selalu objek
    let update = req.body;
    if (typeof update === "string") {
      try { update = JSON.parse(update); } catch { update = {}; }
    }
    update = update || {};

    const token = process.env.BOT_TOKEN;
    if (!token) {
      console.error("BOT_TOKEN missing");
      return res.status(200).json({ ok: true });
    }

    // /start handler
    const msg = update.message;
    const text = msg?.text || "";
    const chatId = msg?.chat?.id;

    if (chatId && /^\/start/i.test(text)) {
      await sendMessage(token, chatId, {
        text: "👋 Selamat datang! Klik tombol di bawah untuk membuka Mini App.",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Open App", web_app: { url: WEBAPP_URL } }]
          ]
        }
      });
    }

    // (opsional) callback_query, dll, di sini…

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    // Telegram hanya butuh 200 supaya gak retry terus
    return res.status(200).json({ ok: true });
  }
};
