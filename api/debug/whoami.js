const { makeSupabase, requireAuth } = require("../_utils");

module.exports = async (req, res) => {
  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

  const { id: telegram_id, username } = auth.user;
  const supabase = makeSupabase();

  // hitung balance via ledger (fallback yang pasti)
  let balance = 0;
  const { data: rows, error: sumErr } = await supabase
    .from("ledger")
    .select("amount")
    .eq("telegram_id", telegram_id);

  if (!sumErr && Array.isArray(rows)) {
    balance = rows.reduce((a, r) => a + Number(r.amount || 0), 0);
  }

  // hitung transaksi & task completed
  const { count: txCount } = await supabase
    .from("ledger")
    .select("id", { head: true, count: "exact" })
    .eq("telegram_id", telegram_id);

  const { count: taskDone } = await supabase
    .from("ledger")
    .select("id", { head: true, count: "exact" })
    .eq("telegram_id", telegram_id)
    .eq("reason", "task_completed");

  res.status(200).json({
    telegram_id, username, txCount: txCount ?? 0, taskDone: taskDone ?? 0, balance
  });
};
