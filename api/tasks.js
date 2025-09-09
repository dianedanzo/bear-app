// api/tasks.js
const { requireUser } = require("./_auth");
const { admin } = require("./_supa");

module.exports = async (req, res) => {
  const a = requireUser(req);
  if (a.error) return res.status(a.error.status).json(a.error.body);
  const { id: telegram_id, username } = a.user;

  const supa = admin();

  if (req.method === "GET") {
    try {
      const t = await supa
        .from("tasks")
        .select("id, type, title, description, reward, channel_url, channel_name, active, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (t.error) return res.status(500).json({ error: "tasks_failed", detail: t.error.message });

      const ut = await supa
        .from("user_tasks")
        .select("task_id")
        .eq("telegram_id", telegram_id);

      const doneSet = new Set((ut.data || []).map(r => r.task_id));

      const items = (t.data || []).map(x => ({
        id: x.id,
        type: x.type,
        title: x.title,
        description: x.description,
        reward: x.reward,
        channel_url: x.channel_url,
        channel_name: x.channel_name,
        active: x.active,
        completed: doneSet.has(x.id), // dipakai UI untuk badge Completed
      }));

      return res.status(200).json({ items });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "tasks_crash" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const task_id = body.task_id || body.id;
      if (!task_id) return res.status(400).json({ error: "missing_task_id" });

      // reward diambil dari DB (jangan percaya angka dari client)
      const t = await supa.from("tasks").select("reward").eq("id", task_id).single();
      if (t.error || !t.data) return res.status(404).json({ error: "task_not_found" });
      const reward = Number(t.data.reward || 0);

      // kalau sudah pernah, jangan dobel
      const prev = await supa
        .from("user_tasks")
        .select("task_id")
        .eq("telegram_id", telegram_id)
        .eq("task_id", task_id)
        .maybeSingle();
      if (!prev.error && prev.data) {
        const b = await supa.rpc("get_balance", { tg_id: telegram_id });
        return res.status(200).json({ ok: true, already: true, balance: Number(b.data || 0) });
      }

      // prefer RPC kamu
      const r = await supa.rpc("complete_task_with_ledger", {
        telegram_id, uname: username, task_id, reward
      });

      // fallback jika RPC tidak ada/failed: catat user_tasks + ledger sederhana
      if (r.error) {
        await supa.from("user_tasks")
          .insert({ telegram_id, task_id, completed_at: new Date().toISOString() })
          .select().single();
        await supa.from("ledger")
          .insert({ telegram_id, amount: reward, reason: "task_reward", ref_id: task_id });
      }

      const b = await supa.rpc("get_balance", { tg_id: telegram_id });
      return res.status(200).json({ ok: true, balance: Number(b.data || 0) });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "complete_crash" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method_not_allowed" });
};
