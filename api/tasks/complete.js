// /api/tasks/complete.js
import { svc } from '../_supabase.js';
import { verifyInitData } from '../_telegram.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();

    const initData = req.headers['x-telegram-init-data'];
    const { telegram_id } = verifyInitData(initData, process.env.BOT_TOKEN);

    const { task_id, reward } = req.body || {};
    if (!task_id || !reward) throw new Error('task_id & reward required');

    const sb = svc();
    const { data, error } = await sb.rpc('complete_telegram_task', {
      p_user_id: telegram_id,
      p_task_id: task_id,
      p_reward: Number(reward)
    });
    if (error) throw error;

    res.status(200).json({ ok: true, result: data });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
}

