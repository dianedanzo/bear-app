import { svc } from './_supabase.js';

function getUser(req){
  const id = req.headers['x-telegram-id'] || req.query?.tid;
  const username = req.headers['x-telegram-username'] || 'User';
  if (!id) throw new Error('unauthorized');
  return { telegram_id: String(id), username: String(username) };
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const { telegram_id, username } = getUser(req);
    const sb = svc();
    await sb.rpc('ensure_public_user', { p_telegram_id: telegram_id, p_username: username });
    const { data, error } = await sb.rpc('get_balance', { p_telegram_id: telegram_id });
    if (error) throw error;
    const balance = Array.isArray(data) ? Number(data?.[0]?.balance ?? 0) : Number(data ?? 0);
    return res.status(200).json({ ok: true, balance });
  } catch (e) {
    return res.status(401).json({ ok: false, error: String(e.message || e) });
  }
}
