const { makeSupabase, requireAuth } = require("./_utils");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();

  // jangan di-cache
  res.setHeader("Cache-Control", "no-store");

  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  const { id: telegram_id, username } = auth.user;

  const supabase = makeSupabase();

  // pastikan user ada (noop kalau sudah ada)
  await supabase.rpc("ensure_public_user", { p_telegram_id: telegram_id, p_username: username }).catch(() => null);

  // 1) coba via RPC get_balance
  let balance = 0;
  const { data: bal } = await supabase.rpc("get_balance", { p_telegram_id: telegram_id });
  if (Array.isArray(bal) && bal[0] && bal[0].balance != null) {
    balance = Number(bal[0].balance);
  } else {
    // 2) fallback: sum langsung dari ledger (ground truth)
    const { data: rows } = await supabase.from("ledger").select("amount").eq("telegram_id", telegram_id);
    if (Array.isArray(rows)) balance = rows.reduce((a, r) => a + Number(r.amount || 0), 0);
  }

  // (opsional) hitung total task selesai untuk header/stat
  const { count: completed } = await supabase
    .from("ledger")
    .select("id", { head: true, count: "exact" })
    .eq("telegram_id", telegram_id)
    .eq("reason", "task_completed");

  return res.status(200).json({
    telegram_id,
    username,
    balance,
    tasks_completed: completed ?? 0
  });
};
