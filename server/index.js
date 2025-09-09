// Express backend dengan verifikasi Telegram + konek Supabase (SERVICE ROLE)
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BOT_TOKEN, CORS_ORIGIN } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BOT_TOKEN) {
  console.error('Missing env SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/BOT_TOKEN'); process.exit(1);
}
app.use(cors({ origin: CORS_ORIGIN ? CORS_ORIGIN.split(',') : true }));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function verifyTelegramInitData(initData, botToken) {
  try {
    const p = new URLSearchParams(initData);
    const hash = p.get('hash'); if (!hash) return false; p.delete('hash');
    const dataCheckString = [...p.entries()].map(([k,v])=>`${k}=${v}`).sort().join('\n');
    const secret = crypto.createHmac('sha256','WebAppData').update(botToken).digest();
    const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash));
  } catch { return false; }
}
function parseUser(initData) {
  const p = new URLSearchParams(initData); const u = p.get('user'); if (!u) return null;
  try { return JSON.parse(u); } catch { return null; }
}
function authRequired(req,res,next){
  const initData = req.header('X-Init-Data') || req.query.initData || req.body?.initData;
  if (!initData || !verifyTelegramInitData(initData, BOT_TOKEN)) return res.status(401).json({error:'invalid_init_data'});
  const user = parseUser(initData); if (!user?.id) return res.status(401).json({error:'invalid_user'});
  req.tg = { id: String(user.id), username: user.username || user.first_name || 'User' }; next();
}

app.get('/api/health', (_,res)=>res.json({ok:true}));

app.get('/api/tasks', authRequired, async (req,res)=>{
  const { data, error } = await supabase.from('tasks')
    .select('id, title, type, reward, channel_url, channel_name, active')
    .eq('active', true).order('created_at',{ascending:false});
  if (error) return res.status(500).json({error:error.message});
  res.json({tasks: data || []});
});

app.get('/api/profile', authRequired, async (req,res)=>{
  const { id: telegram_id, username } = req.tg;
  await supabase.rpc('ensure_public_user',{ p_telegram_id: telegram_id, p_username: username });
  const { data: bal } = await supabase.rpc('get_balance',{ p_telegram_id: telegram_id });
  const { count } = await supabase.from('public_user_tasks')
    .select('task_id',{ count:'exact', head:true }).eq('telegram_id', telegram_id);
  res.json({ telegram_id, username, balance: (bal && bal[0]?.balance) ?? 0, tasks_completed: count ?? 0 });
});

app.post('/api/tasks/complete', authRequired, async (req,res)=>{
  const { id: telegram_id, username } = req.tg;
  const { taskId } = req.body; if (!taskId) return res.status(400).json({error:'missing_taskId'});
  const { data: task, error: taskErr } = await supabase.from('tasks')
    .select('id,reward,active').eq('id', taskId).single();
  if (taskErr || !task || !task.active) return res.status(400).json({error:'invalid_task'});
  const { error } = await supabase.rpc('complete_task_with_ledger',{
    p_telegram_id: telegram_id, p_username: username, p_task_id: task.id, p_reward: task.reward
  });
  if (error) return res.status(400).json({error:error.message});
  const { data: bal } = await supabase.rpc('get_balance',{ p_telegram_id: telegram_id });
  res.json({ ok:true, balance: (bal && bal[0]?.balance) ?? 0 });
});

app.post('/api/withdraw', authRequired, async (req,res)=>{
  const { id: telegram_id } = req.tg;
  const { amount, method, address } = req.body || {};
  if (!amount || !method || !address) return res.status(400).json({error:'missing_params'});
  const { error } = await supabase.rpc('create_withdrawal_request_secure',{
    p_telegram_id: telegram_id, p_amount: amount, p_method: method, p_address: address
  });
  if (error) return res.status(400).json({error:error.message});
  const { data: bal } = await supabase.rpc('get_balance',{ p_telegram_id: telegram_id });
  res.json({ ok:true, balance: (bal && bal[0]?.balance) ?? 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Secure backend running on :'+PORT));
