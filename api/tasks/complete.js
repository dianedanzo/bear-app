import { makeSupabase, requireAuth } from "../_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  const { id: telegram_id, username } = auth.user;
  const { taskId } = req.body || {};
  if (!taskId) return res.status(400).json({ error: "missing_taskId" });

  const supabase = makeSupabase();
  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select("id,reward,active")
    .eq("id", taskId)
    .single();
  if (taskErr || !task || !task.active) return res.status(400).json({ error: "invalid_task" });

  const { error } = await supabase.rpc("complete_task_with_ledger", {
    p_telegram_id: telegram_id,
    p_username: username,
    p_task_id: task.id,
    p_reward: task.reward,
  });
  if (error) return res.status(400).json({ error: error.message });

  const { data: bal } = await supabase.rpc("get_balance", { p_telegram_id: telegram_id });
  res.status(200).json({ ok: true, balance: (bal && bal[0]?.balance) ?? 0 });
}
