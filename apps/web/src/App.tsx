import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function App() {
  const [status, setStatus] = useState<any>(null)
  const [db, setDb] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/status`, { credentials: 'include' })
      .then(r => r.json())
      .then(setStatus)
      .catch(e => setErr(String(e)))

    fetch(`${API_URL}/api/db-check`, { credentials: 'include' })
      .then(r => r.json())
      .then(setDb)
      .catch(() => {})
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, lineHeight: 1.5 }}>
      <h1>CleanFlipRender</h1>
      <p>Vite + React frontend talking to Express API.</p>

      <h2>API Status</h2>
      <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 8, overflow: 'auto' }}>
        {err ? `Error: ${err}` : JSON.stringify(status, null, 2)}
      </pre>

      <h2>DB Check</h2>
      <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(db, null, 2)}
      </pre>
    </div>
  )
}
