const WEBAPP_URL = process.env.WEBAPP_URL || "https://bear-app-lyart.vercel.app";

async function sendMessage(token, chatId, payload) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, ...payload })
  });
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(200).json({ ok: true });
    let upd = req.body;
    if (typeof upd === "string") { try { upd = JSON.parse(upd); } catch { upd = {}; } }

    const token = process.env.BOT_TOKEN;
    if (!token) return res.status(200).json({ ok: true });

    const msg = upd.message;
    const text = msg?.text || "";
    const chatId = msg?.chat?.id;

    if (chatId && /^\/start/i.test(text)) {
      await sendMessage(token, chatId, {
        text: "👋 Selamat datang! Klik tombol di bawah untuk membuka Mini App.",
        reply_markup: { inline_keyboard: [[{ text: "🚀 Open App", web_app: { url: WEBAPP_URL } }]] }
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return res.status(200).json({ ok: true });
  }
};
