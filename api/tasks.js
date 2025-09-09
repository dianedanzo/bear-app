import { makeSupabase, requireAuth } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const auth = requireAuth(req);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

  const supabase = makeSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, type, reward, channel_url, channel_name, active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ tasks: data || [] });
}
