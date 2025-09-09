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
  const init = getInitData(req);
  const botToken = process.env.BOT_TOKEN;
  if (!init || !botToken) return { error: { status: 401, body: { error: "missing_init_or_bot" } } };
  const u = verifyInitData(init, botToken);
  if (!u) return { error: { status: 401, body: { error: "bad_init" } } };
  return { user: u };
}

module.exports = { requireUser };
