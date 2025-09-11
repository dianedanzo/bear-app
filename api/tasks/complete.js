import { svc } from '../_supabase.js';

function getUser(req){
  const id = req.headers['x-telegram-id'] || req.query?.tid;
  if (!id) throw new Error('unauthorized');
  return { telegram_id: String(id) };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    res.setHeader('Cache-Control', 'no-store');
    const { telegram_id } = getUser(req);
    const { task_id, reward } = req.body || {};
    if (!task_id) return res.status(400).json({ ok: false, error: 'missing_task_id' });
    const sb = svc();
    const { error } = await sb.rpc('complete_telegram_task', {
      p_telegram_id: telegram_id,
      p_task_id: task_id,
      p_reward: Number(reward || 0)
    });
    if (error) throw error;
    const { data: bal } = await sb.rpc('get_balance', { p_telegram_id: telegram_id });
    const balance = Array.isArray(bal) ? Number(bal?.[0]?.balance ?? 0) : Number(bal ?? 0);
    return res.status(200).json({ ok: true, balance });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e.message || e) });
  }
}
