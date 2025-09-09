// Jika backend DAN frontend di domain yang sama (Vercel Functions /api/*),
// biarkan kosong (relative). Kalau backend terpisah, isi VITE_API_BASE.
const API_BASE = import.meta.env.VITE_API_BASE || "";

// Ambil initData dari Telegram WebApp (buat verifikasi server)
function getInitData() {
  // @ts-ignore
  const tg = window?.Telegram?.WebApp;
  return tg?.initData || "";
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { "X-Init-Data": getInitData() }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Init-Data": getInitData()
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const secureApi = {
  getHealth: () => apiGet("/api/health"),
  getProfile: () => apiGet("/api/profile"),
  getTasks:   () => apiGet("/api/tasks"),
  completeTask: (taskId: string) => apiPost("/api/tasks/complete", { taskId }),
  requestWithdraw: (amount: number, method: string, address: string) =>
    apiPost("/api/withdraw", { amount, method, address })
};
