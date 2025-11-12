import { useState, useEffect } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Navbar() {
  return (
    <div className="w-full flex items-center justify-between p-4 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center gap-2 font-bold text-lg">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">AI</span>
        <span>Research Agents</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <a className="text-blue-600 hover:underline" href="/test">Health Check</a>
        <a className="text-gray-600 hover:underline" href="https://google.com" target="_blank" rel="noreferrer">Docs</a>
      </div>
    </div>
  )
}

function IngestPanel({ onAdded }) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const ingestUrl = async () => {
    if (!url) return
    setLoading(true); setMsg('')
    try {
      const res = await fetch(`${BACKEND}/api/ingest/url`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setMsg('URL ingested successfully')
      setUrl('')
      onAdded && onAdded()
    } catch (e) { setMsg(e.message) } finally { setLoading(false) }
  }

  const ingestText = async () => {
    if (!text.trim()) return
    setLoading(true); setMsg('')
    try {
      const res = await fetch(`${BACKEND}/api/ingest/text`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setMsg('Text ingested successfully')
      setText('')
      onAdded && onAdded()
    } catch (e) { setMsg(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a URL to collect" className="flex-1 border rounded px-3 py-2" />
        <button onClick={ingestUrl} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Add URL</button>
      </div>
      <div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Or paste text here" rows={4} className="w-full border rounded px-3 py-2"></textarea>
        <div className="flex justify-end mt-2">
          <button onClick={ingestText} disabled={loading} className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50">Add Text</button>
        </div>
      </div>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  )
}

function DocumentsList({ refreshKey }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/documents`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [refreshKey])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Collected Documents</h3>
        <button onClick={load} className="text-sm text-blue-600">Refresh</button>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading...</p> :
        items.length === 0 ? <p className="text-sm text-gray-500">No documents yet.</p> :
        <ul className="space-y-2 max-h-64 overflow-auto pr-2">
          {items.map(d => (
            <li key={d.id} className="border rounded p-3 bg-white">
              <div className="text-xs text-gray-500">{d.source_type} {d.url ? `• ${d.url}` : ''}</div>
              {d.summary && <p className="text-sm mt-1 line-clamp-3">{d.summary}</p>}
            </li>
          ))}
        </ul>
      }
    </div>
  )
}

function ChatPanel() {
  const [q, setQ] = useState('What are the key points from the collected sources?')
  const [answer, setAnswer] = useState('')
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!q.trim()) return
    setLoading(true); setAnswer(''); setSteps([])
    try {
      const res = await fetch(`${BACKEND}/api/ask`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setAnswer(data.answer)
      setSteps(data.steps)
    } catch (e) { setAnswer(`Error: ${e.message}`) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} className="flex-1 border rounded px-3 py-2" />
        <button onClick={ask} disabled={loading} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">Ask</button>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Agents Conversation</h3>
        {steps.length === 0 ? (
          <p className="text-sm text-gray-500">No steps yet.</p>
        ) : (
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="border rounded p-3 bg-white">
                <div className="text-xs text-gray-500">{s.agent}</div>
                <div className="text-sm">{s.action}</div>
                {s.snippets && (
                  <ul className="mt-1 list-disc pl-5 text-sm text-gray-600 space-y-1">
                    {s.snippets.map((t, j) => <li key={j}>{t}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h3 className="font-semibold">Answer</h3>
        <div className="border rounded p-3 bg-white min-h-[80px] text-gray-800 whitespace-pre-wrap">
          {loading ? 'Thinking…' : (answer || 'Ask a question to see the answer here.')}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-800">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="p-5 rounded-xl border bg-white/70 backdrop-blur">
            <h2 className="text-xl font-semibold mb-2">Collect Sources</h2>
            <p className="text-sm text-gray-600 mb-4">Add web pages or paste text. We’ll summarize them for later use.</p>
            <IngestPanel onAdded={() => setRefreshKey(k => k + 1)} />
          </div>
          <div className="p-5 rounded-xl border bg-white/70 backdrop-blur">
            <DocumentsList refreshKey={refreshKey} />
          </div>
        </div>
        <div className="p-5 rounded-xl border bg-white/70 backdrop-blur h-fit">
          <h2 className="text-xl font-semibold mb-2">Ask the Agents</h2>
          <p className="text-sm text-gray-600 mb-4">Questions are answered by a small team: collector → rephraser → answerer.</p>
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}

export default App
