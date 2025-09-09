const { requireUser } = require("./_auth");
const { admin } = require("./_supa");

module.exports = async (req, res) => {
  const a = requireUser(req);
  if (a.error) return res.status(a.error.status).json(a.error.body);
  const { id: telegram_id, username } = a.user;

  try {
    const supa = admin();

    // pastikan user terdaftar
    await supa.rpc("ensure_public_user", { tg_id: telegram_id, uname: username });

    // ambil balance via RPC (sesuai migration kamu)
    let balance = 0;
    const r1 = await supa.rpc("get_balance", { tg_id: telegram_id });
    if (!r1.error && r1.data != null) balance = Number(r1.data) || 0;
    else {
      // fallback kalau RPC gagal: sum ledger
      const r2 = await supa.from("ledger").select("amount").eq("telegram_id", telegram_id);
      if (!r2.error && r2.data) balance = r2.data.reduce((s, row) => s + Number(row.amount || 0), 0);
    }

    const tx = await supa.from("ledger").select("id", { count: "exact", head: true }).eq("telegram_id", telegram_id);
    const td = await supa.from("user_tasks").select("id", { count: "exact", head: true }).eq("telegram_id", telegram_id);

    return res.status(200).json({
      telegram_id,
      username,
      txCount: tx.count || 0,
      taskDone: td.count || 0,
      balance: Number(balance.toFixed(2)),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "profile_failed" });
  }
};
