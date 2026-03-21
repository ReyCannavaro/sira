'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play, RotateCcw, Download, Layout, ChevronRight, X,
  Terminal, Eye, Code2, Maximize2, Minimize2,
  Save, FolderOpen, Plus, Trash2, Check, AlertCircle,
  Loader2, Globe, Lock, Pencil
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import Navbar from '@/components/navigation/Navbar'

interface ConsoleEntry { type: 'log' | 'error' | 'warn' | 'info'; args: string[]; ts: number }
interface Profile { username: string; display_name: string; avatar_url: string | null }
interface Stats { current_level: number }
interface Project { id: string; title: string; description: string | null; is_public: boolean; updated_at: string }

const TEMPLATES: Record<string, { label: string; html: string; css: string; js: string }> = {
  blank: {
    label: 'Blank',
    html: `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <title>Workshop</title>\n</head>\n<body>\n  \n</body>\n</html>`,
    css:  `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: Arial, sans-serif;\n}`,
    js:   `// Tulis JavaScript kamu di sini\nconsole.log('Halo dari Workshop!');`,
  },
  hello: {
    label: 'Hello World',
    html: `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <title>Hello World</title>\n</head>\n<body>\n  <div class="container">\n    <h1>Halo, Dunia!</h1>\n    <p>Selamat datang di Workshop SIRA.</p>\n    <button id="btn">Klik Aku</button>\n  </div>\n</body>\n</html>`,
    css:  `* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n  font-family: Arial, sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}\n\n.container { text-align: center; padding: 40px; }\n\nh1 { font-size: 2rem; color: #22d3ee; margin-bottom: 12px; }\n\nbutton {\n  margin-top: 20px;\n  padding: 10px 24px;\n  background: #22d3ee;\n  color: #0f172a;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 700;\n  cursor: pointer;\n}`,
    js:   `document.getElementById('btn').addEventListener('click', function() {\n  alert('Kamu mengklik tombolnya!');\n  console.log('Tombol diklik!');\n});`,
  },
  counter: {
    label: 'Counter',
    html: `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <title>Counter</title>\n</head>\n<body>\n  <div class="counter">\n    <h2>Counter</h2>\n    <div id="count">0</div>\n    <div class="btns">\n      <button id="dec">−</button>\n      <button id="reset">Reset</button>\n      <button id="inc">+</button>\n    </div>\n  </div>\n</body>\n</html>`,
    css:  `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: monospace; }\n.counter { text-align: center; }\nh2 { color: #94a3b8; font-size: 14px; letter-spacing: .1em; margin-bottom: 16px; }\n#count { font-size: 72px; font-weight: 800; color: #22d3ee; margin-bottom: 24px; }\n.btns { display: flex; gap: 12px; justify-content: center; }\nbutton { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #22d3ee; background: transparent; color: #22d3ee; font-size: 20px; cursor: pointer; }\n#reset { width: auto; padding: 0 16px; border-radius: 24px; font-size: 12px; }`,
    js:   `let count = 0;\nconst el = document.getElementById('count');\ndocument.getElementById('inc').onclick   = () => { count++; el.textContent = count; };\ndocument.getElementById('dec').onclick   = () => { count--; el.textContent = count; };\ndocument.getElementById('reset').onclick = () => { count = 0; el.textContent = 0; };`,
  },
  calculator: {
    label: 'Kalkulator',
    html: `<!DOCTYPE html>\n<html lang="id">\n<head><meta charset="UTF-8"><title>Kalkulator</title></head>\n<body>\n<div class="calc">\n  <div id="display">0</div>\n  <div class="grid">\n    <button class="op" data-v="C">C</button><button class="op" data-v="+/-">+/-</button><button class="op" data-v="%">%</button><button class="act" data-v="/">÷</button>\n    <button data-v="7">7</button><button data-v="8">8</button><button data-v="9">9</button><button class="act" data-v="*">×</button>\n    <button data-v="4">4</button><button data-v="5">5</button><button data-v="6">6</button><button class="act" data-v="-">−</button>\n    <button data-v="1">1</button><button data-v="2">2</button><button data-v="3">3</button><button class="act" data-v="+">+</button>\n    <button class="wide" data-v="0">0</button><button data-v=".">.</button><button class="act" data-v="=">=</button>\n  </div>\n</div>\n</body></html>`,
    css:  `* { margin:0; padding:0; box-sizing:border-box; }\nbody { background:#1a1a2e; display:flex; justify-content:center; align-items:center; min-height:100vh; font-family:Arial; }\n.calc { background:#16213e; border-radius:20px; padding:20px; width:280px; }\n#display { background:#0f3460; color:#e94560; text-align:right; padding:20px 16px; border-radius:12px; font-size:32px; margin-bottom:16px; min-height:68px; word-break:break-all; }\n.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }\nbutton { padding:16px; border:none; border-radius:12px; background:#1a1a2e; color:#e2e8f0; font-size:16px; cursor:pointer; }\nbutton.act { background:#e94560; color:#fff; }\nbutton.op { background:#0f3460; }\nbutton.wide { grid-column:span 2; text-align:left; padding-left:24px; }\nbutton:active { opacity:.7; }`,
    js:   `let expr='';\nconst disp=document.getElementById('display');\nfunction update(v){disp.textContent=v||'0';}\ndocument.querySelectorAll('button').forEach(btn=>{\n  btn.onclick=()=>{\n    const v=btn.dataset.v;\n    if(v==='C'){expr='';update('0');}\n    else if(v==='='){try{const r=eval(expr);update(r);expr=String(r);}catch{update('Error');expr='';}}\n    else if(v==='+/-'){try{expr=String(eval(expr)*-1);update(expr);}catch{}}\n    else if(v==='%'){try{expr=String(eval(expr)/100);update(expr);}catch{}}\n    else{expr+=v;update(expr);}\n  };\n});`,
  },
}

function SaveModal({ html, css, js, currentProject, onClose, onSaved }: {
  html: string; css: string; js: string;
  currentProject: { id: string; title: string } | null;
  onClose: () => void;
  onSaved: (project: { id: string; title: string }) => void;
}) {
  const [title,    setTitle]    = useState(currentProject?.title ?? '')
  const [desc,     setDesc]     = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const isUpdate = !!currentProject

  const handleSave = async () => {
    if (!title.trim()) return setError('Judul project wajib diisi')
    setLoading(true); setError('')
    try {
      let res: Response
      if (isUpdate) {
        res = await fetch(`/api/workshop/projects/${currentProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), html, css, js }),
        })
      } else {
        res = await fetch('/api/workshop/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), description: desc.trim() || undefined, html, css, js, is_public: isPublic }),
        })
      }
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error ?? 'Gagal menyimpan'); return }
      onSaved({ id: isUpdate ? currentProject.id : data.data?.id, title: title.trim() })
    } catch { setError('Koneksi gagal') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0F1A2E', border: '1px solid #22D3EE33', borderRadius: 18, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #22D3EE, #22D3EE44)' }} />
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#22D3EE15', border: '1px solid #22D3EE33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Save size={14} color="#22D3EE" strokeWidth={1.75} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>
              {isUpdate ? 'Update Project' : 'Simpan Project'}
            </h2>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>JUDUL *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nama projectmu..." maxLength={80}
              autoFocus
              style={{ width: '100%', background: '#080F1C', border: '1px solid #1A2535', borderRadius: 9, padding: '10px 13px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = '#22D3EE55'}
              onBlur={e => (e.target as HTMLElement).style.borderColor = '#1A2535'}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {!isUpdate && <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>DESKRIPSI</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Opsional..." maxLength={160}
                style={{ width: '100%', background: '#080F1C', border: '1px solid #1A2535', borderRadius: 9, padding: '10px 13px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = '#22D3EE55'}
                onBlur={e => (e.target as HTMLElement).style.borderColor = '#1A2535'}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 13, color: '#F1F5F9', marginBottom: 2 }}>Project Publik</p>
                <p style={{ fontSize: 11, color: '#475569' }}>Bisa dilihat pengguna lain</p>
              </div>
              <div onClick={() => setIsPublic(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: isPublic ? '#22D3EE' : '#1E2D3D', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: '#F8FAFC', transition: 'left .18s', left: isPublic ? 20 : 2 }} />
              </div>
            </div>
          </>}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', fontSize: 12, marginBottom: 14 }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid #1A2535', background: 'none', color: '#475569', cursor: 'pointer', fontSize: 13 }}>
              Batal
            </button>
            <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: '10px 0', borderRadius: 9, border: 'none', background: loading ? '#1A2535' : '#22D3EE', color: loading ? '#475569' : '#080F1C', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-geist-mono)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><Save size={13} strokeWidth={2.5} /> {isUpdate ? 'Update' : 'Simpan'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectsDrawer({ onLoad, onClose, currentId }: {
  onLoad: (p: { id: string; title: string; html: string; css: string; js: string }) => void;
  onClose: () => void;
  currentId: string | null;
}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workshop/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleLoad = async (id: string, title: string) => {
    const res  = await fetch(`/api/workshop/projects/${id}`)
    const data = await res.json()
    if (data.success) onLoad({ id, title, html: data.data.html_code, css: data.data.css_code, js: data.data.js_code })
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/workshop/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 340, background: '#0A1220', borderLeft: '1px solid #1A2535', display: 'flex', flexDirection: 'column', animation: 'slide-left .2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1A2535' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={15} color="#22D3EE" strokeWidth={1.75} />
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Project Saya</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <Loader2 size={20} color="#22D3EE" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#334155' }}>
              <FolderOpen size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Belum ada project tersimpan</p>
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                background: currentId === p.id ? '#22D3EE0a' : '#0D1A2E',
                border: `1px solid ${currentId === p.id ? '#22D3EE33' : '#1A2535'}`,
              }}>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleLoad(p.id, p.title)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12, fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </span>
                    {p.is_public
                      ? <Globe size={10} color="#34D399" strokeWidth={2} />
                      : <Lock size={10} color="#475569" strokeWidth={2} />
                    }
                  </div>
                  <p style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>
                    {new Date(p.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 4, flexShrink: 0, opacity: deleting === p.id ? 0.5 : 1 }}
                  title="Hapus project"
                >
                  {deleting === p.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #1A2535' }}>
          <p style={{ fontSize: 10, color: '#263348', textAlign: 'center' }}>
            {projects.length}/20 project tersimpan
          </p>
        </div>
      </div>
    </div>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, padding: '10px 18px', borderRadius: 10,
      background: type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.1)',
      border: `1px solid ${type === 'success' ? '#34D39944' : '#F8717144'}`,
      color: type === 'success' ? '#34D399' : '#F87171',
      fontSize: 12, fontFamily: 'var(--font-geist-mono)', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 7,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'toast-up .3s ease',
      whiteSpace: 'nowrap',
    }}>
      {type === 'success' ? <Check size={13} strokeWidth={2.5} /> : <AlertCircle size={13} />}
      {msg}
    </div>
  )
}

function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const taRef  = useRef<HTMLTextAreaElement>(null)
  const lnRef  = useRef<HTMLDivElement>(null)
  const lines  = value.split('\n').length

  const syncScroll = useCallback(() => {
    if (taRef.current && lnRef.current) lnRef.current.scrollTop = taRef.current.scrollTop
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta    = e.currentTarget
      const start = ta.selectionStart
      const end   = ta.selectionEnd
      const next  = value.slice(0, start) + '  ' + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#070D1A' }}>
      <div ref={lnRef} style={{ width: 44, flexShrink: 0, overflowY: 'hidden', background: '#080F1C', borderRight: '1px solid #1A2535', paddingTop: 14, userSelect: 'none' }}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{ fontSize: 11, lineHeight: '1.7em', paddingRight: 10, textAlign: 'right', color: '#1E2D42', fontFamily: 'var(--font-jetbrains-mono)' }}>
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        spellCheck={false}
        autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: '#E2E8F0', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, lineHeight: '1.7em', padding: '14px 16px', overflowY: 'auto' }}
      />
    </div>
  )
}

export default function WorkshopPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats,   setStats]   = useState<Stats | null>(null)

  const [html, setHtml] = useState(TEMPLATES.hello.html)
  const [css,  setCss]  = useState(TEMPLATES.hello.css)
  const [js,   setJs]   = useState(TEMPLATES.hello.js)

  const [activeTab,     setActiveTab]     = useState<'html' | 'css' | 'js'>('html')
  const [consoleLogs,   setConsoleLogs]   = useState<ConsoleEntry[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSave,      setShowSave]      = useState(false)
  const [showProjects,  setShowProjects]  = useState(false)
  const [previewFull,   setPreviewFull]   = useState(false)
  const [autoRun,       setAutoRun]       = useState(true)
  const [runKey,        setRunKey]        = useState(0)
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isDirty,       setIsDirty]       = useState(false)

  const [currentProject, setCurrentProject] = useState<{ id: string; title: string } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const sb = createSupabaseBrowserClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      Promise.all([
        sb.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).single(),
        sb.from('user_stats').select('current_level').eq('user_id', user.id).single(),
      ]).then(([p, s]) => { setProfile(p.data); setStats(s.data) })
    })
  }, [])

  useEffect(() => {
    if (!autoRun) return
    const t = setTimeout(() => setRunKey(k => k + 1), 800)
    return () => clearTimeout(t)
  }, [html, css, js, autoRun])

  useEffect(() => { setIsDirty(true) }, [html, css, js])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        setConsoleLogs(prev => [...prev.slice(-99), { type: e.data.level, args: e.data.args, ts: Date.now() }])
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (currentProject) {
          handleQuickSave()
        } else {
          setShowSave(true)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentProject, html, css, js])

  const handleQuickSave = async () => {
    if (!currentProject) return
    try {
      const res = await fetch(`/api/workshop/projects/${currentProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, css, js }),
      })
      const data = await res.json()
      if (data.success) {
        setIsDirty(false)
        showToast('Tersimpan')
      } else {
        showToast(data.error ?? 'Gagal menyimpan', 'error')
      }
    } catch { showToast('Koneksi gagal', 'error') }
  }

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${css}</style>
<script>
['log','error','warn','info'].forEach(function(level) {
  var orig = console[level].bind(console);
  console[level] = function() {
    var args = Array.from(arguments).map(function(a) {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); }
    });
    window.parent.postMessage({ type: 'console', level: level, args: args }, '*');
    orig.apply(console, arguments);
  };
});
window.onerror = function(msg, src, line) {
  window.parent.postMessage({ type: 'console', level: 'error', args: [msg + ' (line ' + line + ')'] }, '*');
};
<\/script>
</head>
<body>
${html.replace(/<!DOCTYPE[^>]*>/i,'').replace(/<html[^>]*>/i,'').replace(/<\/html>/i,'').replace(/<head>[\s\S]*<\/head>/i,'').replace(/<body[^>]*>/i,'').replace(/<\/body>/i,'')}
<script>${js}<\/script>
</body>
</html>`

  const handleRun = () => { setConsoleLogs([]); setRunKey(k => k + 1) }

  const handleReset = () => {
    setHtml(TEMPLATES.blank.html); setCss(TEMPLATES.blank.css); setJs(TEMPLATES.blank.js)
    setConsoleLogs([]); setRunKey(k => k + 1); setCurrentProject(null); setIsDirty(false)
  }

  const handleTemplate = (key: string) => {
    const t = TEMPLATES[key]
    setHtml(t.html); setCss(t.css); setJs(t.js)
    setConsoleLogs([]); setShowTemplates(false); setRunKey(k => k + 1)
    setCurrentProject(null); setIsDirty(false)
  }

  const handleDownload = () => {
    const full = `<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="UTF-8">\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n<\/script>\n</body>\n</html>`
    const blob = new Blob([full], { type: 'text/html' })
    const a    = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${currentProject?.title ?? 'workshop'}.html`; a.click()
  }

  const TAB_COLOR = { html: '#F59E0B', css: '#A78BFA', js: '#22D3EE' }
  const values    = { html, css, js }
  const setters   = { html: setHtml, css: setCss, js: setJs }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0A1220', color: '#F8FAFC', overflow: 'hidden' }}>
      <Navbar username={profile?.username ?? ''} displayName={profile?.display_name} avatarUrl={profile?.avatar_url} currentLevel={stats?.current_level} />

      <div style={{ height: 50, flexShrink: 0, marginTop: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', background: '#080F1C', borderBottom: '1px solid #1A2535' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Code2 size={15} color="#22D3EE" strokeWidth={1.75} />
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
            {currentProject?.title ?? 'Workshop'}
          </span>
          {isDirty && currentProject && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} title="Ada perubahan belum tersimpan" />
          )}
          {!currentProject && (
            <span style={{ fontSize: 11, color: '#263348' }}>— belum disimpan</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: '#334155' }}>Auto</span>
            <div onClick={() => setAutoRun(v => !v)} style={{ width: 32, height: 18, borderRadius: 99, background: autoRun ? '#22D3EE' : '#1E2D3D', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
              <div style={{ position: 'absolute', top: 2, left: autoRun ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#F8FAFC', transition: 'left .18s' }} />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowTemplates(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, border: '1px solid #1A2535', background: 'none', color: '#475569', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-inter)' }}>
              <Layout size={11} strokeWidth={1.75} /> Template
            </button>
            {showTemplates && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 20, background: '#0F1A2E', border: '1px solid #1A2535', borderRadius: 10, padding: 6, minWidth: 150, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button key={key} onClick={() => handleTemplate(key)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 11px', borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 12, textAlign: 'left', transition: 'all .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1A2535'; (e.currentTarget as HTMLElement).style.color = '#F1F5F9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#94A3B8' }}>
                    <ChevronRight size={10} strokeWidth={2} /> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowProjects(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, border: '1px solid #1A2535', background: 'none', color: '#475569', cursor: 'pointer', fontSize: 11 }}>
            <FolderOpen size={11} strokeWidth={1.75} /> Proyek
          </button>

          <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, border: '1px solid #1A2535', background: 'none', color: '#475569', cursor: 'pointer', fontSize: 11 }}>
            <RotateCcw size={11} strokeWidth={2} />
          </button>

          <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, border: '1px solid #1A2535', background: 'none', color: '#475569', cursor: 'pointer', fontSize: 11 }}>
            <Download size={11} strokeWidth={1.75} />
          </button>

          {currentProject && isDirty ? (
            <button onClick={handleQuickSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: 'none', background: '#F59E0B', color: '#080F1C', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-geist-mono)' }}>
              <Save size={11} strokeWidth={2.5} /> Simpan
            </button>
          ) : (
            <button onClick={() => setShowSave(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: '1px solid #22D3EE44', background: '#22D3EE0a', color: '#22D3EE', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-geist-mono)' }}>
              <Save size={11} strokeWidth={2.5} /> {currentProject ? 'Simpan Baru' : 'Simpan'}
            </button>
          )}

          <button onClick={handleRun} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: 'none', background: '#22D3EE', color: '#080F1C', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-geist-mono)', boxShadow: '0 0 10px #22D3EE33' }}>
            <Play size={11} strokeWidth={2.5} fill="currentColor" /> Run
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {!previewFull && (
          <div style={{ width: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1A2535' }}>
            <div style={{ display: 'flex', background: '#080F1C', borderBottom: '1px solid #1A2535', flexShrink: 0 }}>
              {(['html', 'css', 'js'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '9px 20px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-geist-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: activeTab === tab ? '#070D1A' : 'transparent', color: activeTab === tab ? TAB_COLOR[tab] : '#334155', borderBottom: `2px solid ${activeTab === tab ? TAB_COLOR[tab] : 'transparent'}`, transition: 'all .15s' }}>
                  {tab}
                </button>
              ))}
            </div>
            <CodeEditor value={values[activeTab]} onChange={v => { setters[activeTab](v); setIsDirty(true) }} />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: previewFull ? 1 : '0 0 60%', display: 'flex', flexDirection: 'column', borderBottom: previewFull ? 'none' : '1px solid #1A2535' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 13px', background: '#080F1C', borderBottom: '1px solid #1A2535', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={11} color="#475569" strokeWidth={1.75} />
                <span style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em' }}>PREVIEW</span>
              </div>
              <button onClick={() => setPreviewFull(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 2 }}>
                {previewFull ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
              </button>
            </div>
            <iframe key={runKey} srcDoc={srcDoc} sandbox="allow-scripts allow-same-origin" style={{ flex: 1, border: 'none', background: '#fff' }} title="preview" />
          </div>

          {!previewFull && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 13px', background: '#080F1C', borderBottom: '1px solid #1A2535', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Terminal size={11} color="#475569" strokeWidth={1.75} />
                  <span style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em' }}>CONSOLE</span>
                  {consoleLogs.length > 0 && <span style={{ fontSize: 9, padding: '0 5px', borderRadius: 99, background: '#1A2535', color: '#475569' }}>{consoleLogs.length}</span>}
                </div>
                <button onClick={() => setConsoleLogs([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155' }}>
                  <X size={11} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 13px', background: '#060C18', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}>
                {consoleLogs.length === 0
                  ? <span style={{ color: '#1E2D42' }}>// console.log() akan muncul di sini</span>
                  : consoleLogs.map((log, i) => {
                      const color  = log.type === 'error' ? '#F87171' : log.type === 'warn' ? '#FBBF24' : '#94A3B8'
                      const prefix = log.type === 'error' ? '✗' : log.type === 'warn' ? '!' : '›'
                      return (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                          <span style={{ color, flexShrink: 0 }}>{prefix}</span>
                          <span style={{ color, wordBreak: 'break-all', lineHeight: 1.5 }}>{log.args.join(' ')}</span>
                        </div>
                      )
                    })
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {showTemplates && <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowTemplates(false)} />}

      {showSave && (
        <SaveModal
          html={html} css={css} js={js}
          currentProject={null}
          onClose={() => setShowSave(false)}
          onSaved={p => { setCurrentProject(p); setIsDirty(false); setShowSave(false); showToast(`"${p.title}" berhasil disimpan`) }}
        />
      )}

      {showProjects && (
        <ProjectsDrawer
          currentId={currentProject?.id ?? null}
          onClose={() => setShowProjects(false)}
          onLoad={p => {
            setHtml(p.html); setCss(p.css); setJs(p.js)
            setCurrentProject({ id: p.id, title: p.title })
            setIsDirty(false); setRunKey(k => k + 1)
            setShowProjects(false)
            showToast(`Project "${p.title}" dimuat`)
          }}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <style jsx>{`
        @keyframes spin      { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes toast-up  { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes slide-left { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}