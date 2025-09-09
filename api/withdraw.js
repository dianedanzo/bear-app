import { makeSupabase, requireAuth } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  const { id: telegram_id } = auth.user;

  const { amount, method, address } = req.body || {};
  if (!amount || !method || !address)
    return res.status(400).json({ error: "missing_params" });

  const supabase = makeSupabase();
  const { error } = await supabase.rpc("create_withdrawal_request_secure", {
    p_telegram_id: telegram_id,
    p_amount: amount,
    p_method: method,
    p_address: address,
  });
  if (error) return res.status(400).json({ error: error.message });

  const { data: bal } = await supabase.rpc("get_balance", { p_telegram_id: telegram_id });
  res.status(200).json({ ok: true, balance: (bal && bal[0]?.balance) ?? 0 });
}
