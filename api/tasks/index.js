// api/tasks.js
const { makeSupabase, requireAuth } = require("./_utils");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();

  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  const { id: telegram_id } = auth.user;

  const supabase = makeSupabase();

  // semua task aktif
  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("id, title, type, reward, channel_url, channel_name, active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (tErr) return res.status(500).json({ error: tErr.message });

  // task yg sudah user selesaikan
  const { data: done, error: dErr } = await supabase
    .from("public_user_tasks")
    .select("task_id")
    .eq("telegram_id", telegram_id);

  if (dErr) return res.status(500).json({ error: dErr.message });

  const doneSet = new Set((done || []).map(r => r.task_id));

  const withStatus = (tasks || []).map(t => ({
    ...t,
    completed: doneSet.has(t.id)
  }));

  res.status(200).json({ tasks: withStatus });
};
