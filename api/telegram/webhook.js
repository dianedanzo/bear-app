// api/telegram/webhook.js
const fetch = global.fetch; // Vercel sudah ada
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://bear-app-lyart.vercel.app";

async function sendMessage(chatId, text, extra) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text, ...extra };
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const update = req.body;

    // Handle /start
    const msg = update.message;
    if (msg && msg.text && /^\/start/i.test(msg.text)) {
      await sendMessage(msg.chat.id, "👋 Selamat datang! Buka Mini App di bawah ini:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Open App", web_app: { url: WEBAPP_URL } }],
          ],
        },
      });
    }

    // (Optional) handle button callbacks dsb di sini…

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true }); // Telegram butuh 200 cepat
  }
};
