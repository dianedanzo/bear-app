// api/tasks.js
const { makeSupabase, requireAuth } = require("./_utils");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();

  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  const { id: telegram_id } = auth.user;

  const supabase = makeSupabase();

  // pastikan user ada (aman, no-op kalau sudah ada)
  await supabase.rpc("ensure_public_user", { p_telegram_id: telegram_id, p_username: "tg" }).catch(() => null);

  // 1) ambil semua task aktif
  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("id, title, type, reward, channel_url, channel_name, active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (tErr) return res.status(500).json({ error: tErr.message });

  // 2) coba ambil task yang sudah selesai dari public_user_tasks
  let doneIds = new Set();
  const { data: done1, error: dErr1 } = await supabase
    .from("public_user_tasks")
    .select("task_id")
    .eq("telegram_id", telegram_id);

  if (!dErr1) {
    doneIds = new Set((done1 || []).map(r => r.task_id));
  } else {
    // 3) fallback: ambil dari ledger (reason='task_completed', ref_id=task_id)
    const { data: done2, error: dErr2 } = await supabase
      .from("ledger")
      .select("ref_id, reason")
      .eq("telegram_id", telegram_id)
      .eq("reason", "task_completed");
    if (!dErr2) {
      doneIds = new Set((done2 || []).map(r => r.ref_id));
    }
  }

  const withStatus = (tasks || []).map(t => ({
    ...t,
    completed: doneIds.has(t.id)
  }));

  return res.status(200).json({ tasks: withStatus });
};
