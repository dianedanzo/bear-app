// api/debug-snapshot.js
const { createClient } = require("@supabase/supabase-js");
const { requireUser } = require("./_auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control","no-store");

  const a = requireUser(req);
  if (a.error) return res.status(a.error.status).json(a.error.body);
  const { id: telegram_id, username } = a.user;

  const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });

  const [tasks, userTasks, ledger, balRpc] = await Promise.all([
    supa.from("tasks").select("id,title,reward,active").eq("active",true),
    supa.from("user_tasks").select("task_id,completed_at").eq("telegram_id", telegram_id),
    supa.from("ledger").select("amount,reason,ref_id,created_at").eq("telegram_id", telegram_id).order("created_at",{ascending:false}).limit(10),
    supa.rpc("get_balance",{ tg_id: telegram_id })
  ]);

  const done = new Set((userTasks.data||[]).map(r=>r.task_id));
  const items = (tasks.data||[]).map(t=>({ id:t.id, title:t.title, reward:t.reward, completed: done.has(t.id) }));
  const sum = (ledger.data||[]).reduce((s,r)=>s+Number(r.amount||0),0);

  return res.status(200).json({
    user: { telegram_id, username },
    dev_mode: !!a.dev,
    tasks: items,
    user_tasks_count: userTasks.data?.length||0,
    balance_rpc: Number(balRpc.data||0),
    balance_sum: Number(sum.toFixed(2)),
    last_ledger: ledger.data||[]
  });
};
