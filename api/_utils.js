// api/_utils.js  (CommonJS)

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// ---- Supabase client (service role) ----
function makeSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---- Telegram initData verification ----
// Parse "a=1&b=2" -> { a:"1", b:"2" }
function parseInitData(raw) {
  const out = {};
  (raw || "").split("&").forEach(pair => {
    const i = pair.indexOf("=");
    if (i === -1) return;
    const k = decodeURIComponent(pair.slice(0, i));
    const v = decodeURIComponent(pair.slice(i + 1));
    out[k] = v;
  });
  return out;
}

function verifyTelegramInitData(raw, botToken) {
  if (!raw || !botToken) return false;
  const data = parseInitData(raw);
  if (!data.hash) return false;

  const checkString = Object.keys(data)
    .filter(k => k !== "hash")
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hex = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
  return hex === data.hash;
}

function userFromInitData(raw) {
  const data = parseInitData(raw);
  // user field is JSON: {"id":12345,"username":"foo",...}
  let user = {};
  try { user = JSON.parse(data.user || "{}"); } catch {}
  return {
    id: String(user.id || ""),
    username: user.username || ""
  };
}

// ---- Auth wrapper used by all API routes ----
function requireAuth(req) {
  // Dev bypass (ONLY when ALLOW_DEV_INIT=1)
  if ((process.env.ALLOW_DEV_INIT || "0") === "1" && req.query && req.query.dev === "1") {
    const id = String(req.query.telegram_id || "");
    const username = String(req.query.username || "");
    if (!id) return { error: { status: 400, body: { error: "missing_dev_id" } } };
    return { user: { id, username } };
  }

  const raw = req.headers["x-init-data"] || req.headers["x-initdata"] || "";
  const token = process.env.BOT_TOKEN || "";
  if (!raw) return { error: { status: 401, body: { error: "missing_init_data" } } };
  if (!token) return { error: { status: 500, body: { error: "bot_token_missing" } } };

  const ok = verifyTelegramInitData(String(raw), token);
  if (!ok) return { error: { status: 401, body: { error: "invalid_init_data" } } };

  const u = userFromInitData(String(raw));
  if (!u.id) return { error: { status: 401, body: { error: "invalid_user" } } };

  return { user: u };
}

module.exports = { makeSupabase, requireAuth };
