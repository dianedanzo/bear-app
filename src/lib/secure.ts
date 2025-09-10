// src/lib/secure.ts
export async function secureGet(path: string) {
  const initData = (window as any)?.Telegram?.WebApp?.initData || '';
  const resp = await fetch(path, {
    headers: { 'X-Telegram-Init-Data': initData }
  });
  return resp.json();
}

export async function securePost(path: string, body: any) {
  const initData = (window as any)?.Telegram?.WebApp?.initData || '';
  const resp = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData
    },
    body: JSON.stringify(body)
  });
  return resp.json();
}
