const { makeSupabase, requireAuth } = require("./_utils");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();

  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  const { id: telegram_id, username } = auth.user;

  const supabase = makeSupabase();
  await supabase.rpc("ensure_public_user", { p_telegram_id: telegram_id, p_username: username });

  const { data: bal, error: balErr } = await supabase.rpc("get_balance", { p_telegram_id: telegram_id });
  if (balErr) return res.status(500).json({ error: balErr.message });

  const { count: completed } = await supabase
    .from("public_user_tasks")
    .select("task_id", { count: "exact", head: true })
    .eq("telegram_id", telegram_id);

  res.status(200).json({
    telegram_id,
    username,
    balance: (bal && bal[0]?.balance) ?? 0,
    tasks_completed: completed ?? 0
  });
};
