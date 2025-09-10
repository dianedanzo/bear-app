// /api/ads/complete.js
import { svc } from '../_supabase.js';
import { verifyInitData } from '../_telegram.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();

    const initData = req.headers['x-telegram-init-data'];
    const { telegram_id } = verifyInitData(initData, process.env.BOT_TOKEN);

    const { reward, block_id } = req.body || {};
    if (!reward || !block_id) throw new Error('reward & block_id required');

    const sb = svc();
    const { data, error } = await sb.rpc('complete_ad_task', {
      p_user_id: telegram_id,
      p_reward: Number(reward),
      p_ref: String(block_id)
    });
    if (error) throw error;

    res.status(200).json({ ok: true, result: data });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
}
