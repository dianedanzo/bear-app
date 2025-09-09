// api/tasks/index.js  (atau api/tasks.js jika di root /api)
const { makeSupabase, requireAuth } = require("../_utils"); // <-- kalau file di root: "./_utils"

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();

  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  const { id: telegram_id } = auth.user;

  const supabase = makeSupabase();

  // 1) semua task aktif
  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("id, title, type, reward, channel_url, channel_name, active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (tErr) return res.status(500).json({ error: tErr.message });

  // 2) ambil task yang SUDAH diberi reward ke user ini dari ledger
  //    - ref_id = task.id
  //    - amount > 0 (reward masuk)
  //    - telegram_id = user
  const { data: paid, error: pErr } = await supabase
    .from("ledger")
    .select("ref_id")
    .eq("telegram_id", telegram_id)
    .not("ref_id", "is", null)
    .gt("amount", 0);

  if (pErr) return res.status(500).json({ error: pErr.message });

  const doneSet = new Set((paid || []).map(r => String(r.ref_id)));

  // 3) gabungkan → tandai completed
  const withStatus = (tasks || []).map(t => ({
    ...t,
    completed: doneSet.has(String(t.id))
  }));

  return res.status(200).json({ tasks: withStatus });
};
