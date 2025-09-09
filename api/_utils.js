import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export function makeSupabase() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function verifyTelegramInitData(initData, botToken) {
  try {
    const p = new URLSearchParams(initData || "");
    const hash = p.get("hash");
    if (!hash) return false;
    p.delete("hash");
    const dataCheckString = [...p.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("\n");
    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const calc = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function parseUserFromInitData(initData) {
  const p = new URLSearchParams(initData || "");
  const s = p.get("user");
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export function requireAuth(req) {
  const initData = req.headers["x-init-data"] || req.query.initData || req.body?.initData;
  const { BOT_TOKEN } = process.env;
  if (!initData || !BOT_TOKEN || !verifyTelegramInitData(initData, BOT_TOKEN)) {
    return { error: { status: 401, body: { error: "invalid_init_data" } } };
  }
  const u = parseUserFromInitData(initData);
  if (!u?.id) return { error: { status: 401, body: { error: "invalid_user" } } };
  return { user: { id: String(u.id), username: u.username || u.first_name || "User" } };
}
