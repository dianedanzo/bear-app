import React, { useState } from "react";

export default function DebugButton() {
  const [out, setOut] = useState(null);

  async function run() {
    try {
      const tg = window?.Telegram?.WebApp;
      const info = {
        hasTelegram: !!window?.Telegram,
        hasWebApp: !!tg,
        initDataLength: (tg?.initData || "").length,
        initDataPreview: (tg?.initData || "").slice(0, 60),
      };

      const echo = await fetch("/api/debug/echo").then(r => r.json()).catch(e => ({ error: String(e) }));
      const who  = await fetch("/api/debug/whoami").then(r => r.json()).catch(e => ({ error: String(e) }));

      setOut({ info, echo, who });
      alert(JSON.stringify({ info, echo, who }, null, 2));
    } catch (e) {
      alert("ERR " + e);
    }
  }

  const styleBtn = {
    position: "fixed", right: 12, bottom: 12, zIndex: 99999,
    padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc",
    background: "#fff", color: "#333", fontWeight: 600,
  };

  return <button style={styleBtn} onClick={run}>Debug API</button>;
}
