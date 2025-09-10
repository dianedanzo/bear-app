// /api/tasks/list.js
import { svc } from '../_supabase.js';
import { verifyInitData } from '../_telegram.js';

export default async function handler(req, res) {
  try {
    const initData = req.headers['x-telegram-init-data'];
    const { telegram_id } = verifyInitData(initData, process.env.BOT_TOKEN);

    const sb = svc();
    const { data, error } = await sb.rpc('list_tasks_for_user', { p_user_id: telegram_id });
    if (error) throw error;

    res.status(200).json({ ok: true, tasks: data || [] });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
}
