// api/_auth.js  (CommonJS)
const crypto = require("crypto");

function getInitData(req) {
  try {
    const v = req.headers["x-init-data"] || req.headers["X-Init-Data"];
    return typeof v === "string" ? v : "";
  } catch (_) { return ""; }
}

function verifyInitData(init, botToken) {
  try {
    const p = new URLSearchParams(init);
    const hash = p.get("hash"); p.delete("hash");

    const dataCheckString = [...p.entries()]
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k,v]) => `${k}=${v}`)
      .join("\n");

    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const check = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
    if (check !== hash) return null;

    const user = JSON.parse(p.get("user") || "{}");
    if (!user?.id) return null;
    return { id: String(user.id), username: user.username || null };
  } catch (_) { return null; }
}

function requireUser(req) {
  // 1) normal (dari Telegram)
  const init = getInitData(req);
  const botToken = process.env.BOT_TOKEN;

  // 2) DEV OVERRIDE via query (untuk tes di Chrome)
  const q = req.query || {};
  const isDev = q.dev === "1";
  const dbgToken = process.env.DEBUG_TOKEN;

  if (isDev && dbgToken && q.token === dbgToken && q.tg_id) {
    return { user: { id: String(q.tg_id), username: q.username || null }, dev: true };
  }

  if (!init || !botToken) return { error: { status: 401, body: { error: "missing_init_or_bot" } } };
  const u = verifyInitData(init, botToken);
  if (!u) return { error: { status: 401, body: { error: "bad_init" } } };
  return { user: u };
}

module.exports = { requireUser };
