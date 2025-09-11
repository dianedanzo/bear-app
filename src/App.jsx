import React, { useEffect, useState } from 'react'

const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

function getIdentity() {
  const u = tg?.initDataUnsafe?.user
  const url = new URL(window.location.href)
  const id = u?.id || url.searchParams.get('tid')
  const name = u?.username || url.searchParams.get('uname') || 'User'
  return { id, name }
}

async function api(path, body) {
  const { id, name } = getIdentity()
  const opts = {
    headers: { 'x-telegram-id': id, 'x-telegram-username': name }
  }
  if (body) {
    opts.method = 'POST'
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const r = await fetch(path, opts)
  if (!r.ok) throw new Error(await r.text())
  return await r.json()
}

export default function App() {
  const [{id, name}, setU] = useState({id: null, name: 'User'})
  const [balance, setBalance] = useState(null)
  const [tasks, setTasks] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    try { tg?.ready(); tg?.expand(); } catch {}
    const ident = getIdentity()
    setU({id: ident.id, name: ident.name})
    refresh()
  }, [])

  async function refresh() {
    setMsg('')
    try {
      const b = await api('/api/balance')
      if (typeof b?.balance === 'number') setBalance(b.balance)
    } catch (e) { setMsg('balance error') }
    try {
      const t = await api('/api/tasks/list')
      if (Array.isArray(t?.tasks)) setTasks(t.tasks)
    } catch (e) { setMsg(m => (m? m+'; ' : '') + 'tasks error') }
  }

  async function completeTask(id, reward) {
    try {
      const out = await api('/api/tasks/complete', { task_id: id, reward })
      if (typeof out?.balance === 'number') setBalance(out.balance)
      await refresh()
    } catch (e) {
      alert('Complete error: ' + (e?.message || e))
    }
  }

  async function rewardAd() {
    try {
      const out = await api('/api/ads/complete', { reward: 0.003, block_id: 'ad-1' })
      if (typeof out?.balance === 'number') setBalance(out.balance)
    } catch (e) {
      alert('Ad error: ' + (e?.message || e))
    }
  }

  return (
    <div style={{fontFamily:'Inter,system-ui,Arial', background:'#0f1115', color:'#e8eefc', minHeight:'100vh', padding:20}}>
      <h2>MiniApp</h2>
      <div style={{opacity:0.8}}>User: <b>{name || 'User'}</b> (id: {id || '—'})</div>

      <div style={{marginTop:12, padding:12, border:'1px solid #263042', borderRadius:12, background:'#151a24'}}>
        <div>Balance: <b>{balance ?? '—'}</b></div>
        <button onClick={refresh} style={{marginTop:8, padding:'8px 12px', borderRadius:10, background:'#1c2432', border:'1px solid #2a3347', color:'#e8eefc', cursor:'pointer'}}>Refresh</button>
        <button onClick={rewardAd} style={{marginLeft:8, padding:'8px 12px', borderRadius:10, background:'#1c2432', border:'1px solid #2a3347', color:'#e8eefc', cursor:'pointer'}}>Simulate Ad +0.003</button>
        {msg && <div style={{marginTop:8, color:'#f88'}}>{msg}</div>}
      </div>

      <div style={{marginTop:16}}>
        <h3>Tasks</h3>
        {tasks.length === 0 && <div style={{opacity:.7}}>No tasks</div>}
        {tasks.map((t) => (
          <div key={t.id} style={{margin:'8px 0', padding:10, border:'1px solid #263042', borderRadius:10, background:'#151a24'}}>
            <div style={{fontWeight:600}}>{t.title || t.id}</div>
            <div style={{opacity:.8}}>{t.description || '(no description)'}</div>
            <div style={{marginTop:6, display:'flex', gap:8, alignItems:'center'}}>
              <span>Reward: {t.reward}</span>
              {t.is_completed ? (
                <span style={{opacity:.8}}>✅ Completed</span>
              ) : (
                <button onClick={() => completeTask(t.id, t.reward)} style={{padding:'6px 10px', borderRadius:8, background:'#1c2432', border:'1px solid #2a3347', color:'#e8eefc', cursor:'pointer'}}>Complete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
