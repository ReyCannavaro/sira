'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Play, RotateCcw, Download, Layout, ChevronRight, X, Terminal, Eye, Code2, Maximize2, Minimize2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import Navbar from '@/components/navigation/Navbar'

/* ─── Types ── */
interface ConsoleEntry { type: 'log' | 'error' | 'warn' | 'info'; args: string[]; ts: number }
interface Profile { username: string; display_name: string; avatar_url: string | null }
interface Stats { current_level: number }

/* ─── Templates ── */
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
    css:  `* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n  font-family: Arial, sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}\n\n.container {\n  text-align: center;\n  padding: 40px;\n}\n\nh1 {\n  font-size: 2rem;\n  color: #22d3ee;\n  margin-bottom: 12px;\n}\n\nbutton {\n  margin-top: 20px;\n  padding: 10px 24px;\n  background: #22d3ee;\n  color: #0f172a;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 700;\n  cursor: pointer;\n}`,
    js:   `document.getElementById('btn').addEventListener('click', function() {\n  alert('Kamu mengklik tombolnya!');\n  console.log('Tombol diklik!');\n});`,
  },
  counter: {
    label: 'Counter',
    html: `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <title>Counter</title>\n</head>\n<body>\n  <div class="counter">\n    <h2>Counter</h2>\n    <div id="count">0</div>\n    <div class="btns">\n      <button id="dec">−</button>\n      <button id="reset">Reset</button>\n      <button id="inc">+</button>\n    </div>\n  </div>\n</body>\n</html>`,
    css:  `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody {\n  background: #0f172a; color: #f8fafc;\n  display: flex; align-items: center; justify-content: center; min-height: 100vh;\n  font-family: monospace;\n}\n.counter { text-align: center; }\nh2 { color: #94a3b8; font-size: 14px; letter-spacing: .1em; margin-bottom: 16px; }\n#count { font-size: 72px; font-weight: 800; color: #22d3ee; margin-bottom: 24px; }\n.btns { display: flex; gap: 12px; justify-content: center; }\nbutton {\n  width: 48px; height: 48px; border-radius: 50%;\n  border: 2px solid #22d3ee; background: transparent;\n  color: #22d3ee; font-size: 20px; cursor: pointer;\n}\n#reset { width: auto; padding: 0 16px; border-radius: 24px; font-size: 12px; }`,
    js:   `let count = 0;\nconst el = document.getElementById('count');\n\ndocument.getElementById('inc').onclick   = () => { count++; el.textContent = count; console.log('Count:', count); };\ndocument.getElementById('dec').onclick   = () => { count--; el.textContent = count; };\ndocument.getElementById('reset').onclick = () => { count = 0; el.textContent = 0; console.log('Reset!'); };`,
  },
  calculator: {
    label: 'Kalkulator',
    html: `<!DOCTYPE html>\n<html lang="id">\n<head><meta charset="UTF-8"><title>Kalkulator</title></head>\n<body>\n<div class="calc">\n  <div id="display">0</div>\n  <div class="grid">\n    <button class="op" data-v="C">C</button>\n    <button class="op" data-v="+/-">+/-</button>\n    <button class="op" data-v="%">%</button>\n    <button class="act" data-v="/">÷</button>\n    <button data-v="7">7</button><button data-v="8">8</button><button data-v="9">9</button>\n    <button class="act" data-v="*">×</button>\n    <button data-v="4">4</button><button data-v="5">5</button><button data-v="6">6</button>\n    <button class="act" data-v="-">−</button>\n    <button data-v="1">1</button><button data-v="2">2</button><button data-v="3">3</button>\n    <button class="act" data-v="+">+</button>\n    <button class="wide" data-v="0">0</button>\n    <button data-v=".">.</button>\n    <button class="act" data-v="=">=</button>\n  </div>\n</div>\n</body></html>`,
    css:  `* { margin:0; padding:0; box-sizing:border-box; }\nbody { background:#1a1a2e; display:flex; justify-content:center; align-items:center; min-height:100vh; font-family:Arial; }\n.calc { background:#16213e; border-radius:20px; padding:20px; width:280px; }\n#display { background:#0f3460; color:#e94560; text-align:right; padding:20px 16px; border-radius:12px; font-size:32px; margin-bottom:16px; min-height:68px; word-break:break-all; }\n.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }\nbutton { padding:16px; border:none; border-radius:12px; background:#1a1a2e; color:#e2e8f0; font-size:16px; cursor:pointer; }\nbutton.act { background:#e94560; color:#fff; }\nbutton.op { background:#0f3460; color:#e2e8f0; }\nbutton.wide { grid-column:span 2; text-align:left; padding-left:24px; }\nbutton:active { opacity:.7; }`,
    js:   `let expr = '';\nconst disp = document.getElementById('display');\nfunction update(v) { disp.textContent = v || '0'; }\ndocument.querySelectorAll('button').forEach(btn => {\n  btn.onclick = () => {\n    const v = btn.dataset.v;\n    if (v === 'C') { expr = ''; update('0'); }\n    else if (v === '=') { try { const r = eval(expr); update(r); expr = String(r); } catch { update('Error'); expr = ''; } }\n    else if (v === '+/-') { try { expr = String(eval(expr) * -1); update(expr); } catch {} }\n    else if (v === '%') { try { expr = String(eval(expr) / 100); update(expr); } catch {} }\n    else { expr += v; update(expr); }\n  };\n});`,
  },
}

/* ─── Code Editor with line numbers ── */
function CodeEditor({ value, onChange, language, disabled }: {
  value: string; onChange: (v: string) => void; language: string; disabled?: boolean
}) {
  const taRef   = useRef<HTMLTextAreaElement>(null)
  const lnRef   = useRef<HTMLDivElement>(null)
  const lines   = value.split('\n').length

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

  const langColor: Record<string, string> = { html: '#F59E0B', css: '#A78BFA', js: '#22D3EE' }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#070D1A' }}>
      {/* Line numbers */}
      <div ref={lnRef} style={{
        width: 44, flexShrink: 0, overflowY: 'hidden',
        background: '#080F1C', borderRight: '1px solid #1A2535',
        paddingTop: 14, userSelect: 'none',
      }}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{
            fontSize: 11, lineHeight: '1.7em', paddingRight: 10,
            textAlign: 'right', color: '#1E2D42',
            fontFamily: 'var(--font-jetbrains-mono)',
          }}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{
          flex: 1, resize: 'none', border: 'none', outline: 'none',
          background: 'transparent', color: '#E2E8F0',
          fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13,
          lineHeight: '1.7em', padding: '14px 16px', overflowY: 'auto',
        }}
      />
    </div>
  )
}

/* ─── Main Page ── */
export default function WorkshopPage() {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats,   setStats]   = useState<Stats | null>(null)

  const [html, setHtml] = useState(TEMPLATES.hello.html)
  const [css,  setCss]  = useState(TEMPLATES.hello.css)
  const [js,   setJs]   = useState(TEMPLATES.hello.js)

  const [activeTab,    setActiveTab]    = useState<'html' | 'css' | 'js'>('html')
  const [consoleLogs,  setConsoleLogs]  = useState<ConsoleEntry[]>([])
  const [showTemplates,setShowTemplates]= useState(false)
  const [previewFull,  setPreviewFull]  = useState(false)
  const [autoRun,      setAutoRun]      = useState(true)
  const [runKey,       setRunKey]       = useState(0)

  // Load user
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

  // Auto run on code change
  useEffect(() => {
    if (!autoRun) return
    const t = setTimeout(() => setRunKey(k => k + 1), 800)
    return () => clearTimeout(t)
  }, [html, css, js, autoRun])

  // Listen console messages dari iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        setConsoleLogs(prev => [...prev.slice(-99), { type: e.data.level, args: e.data.args, ts: Date.now() }])
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${css}</style>
<script>
// Intercept console untuk dikirim ke parent
['log','error','warn','info'].forEach(function(level) {
  var orig = console[level].bind(console);
  console[level] = function() {
    var args = Array.from(arguments).map(function(a) {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch(e) { return String(a); }
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
${html.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '').replace(/<head>[\s\S]*<\/head>/i, '').replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '')}
<script>${js}<\/script>
</body>
</html>`

  const handleRun = () => {
    setConsoleLogs([])
    setRunKey(k => k + 1)
  }

  const handleReset = () => {
    setHtml(TEMPLATES.blank.html)
    setCss(TEMPLATES.blank.css)
    setJs(TEMPLATES.blank.js)
    setConsoleLogs([])
    setRunKey(k => k + 1)
  }

  const handleTemplate = (key: string) => {
    const t = TEMPLATES[key]
    setHtml(t.html); setCss(t.css); setJs(t.js)
    setConsoleLogs([]); setShowTemplates(false)
    setRunKey(k => k + 1)
  }

  const handleDownload = () => {
    const full = `<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="UTF-8">\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n</script>\n</body>\n</html>`
    const blob = new Blob([full], { type: 'text/html' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = 'workshop.html'
    a.click()
  }

  const TAB_COLOR = { html: '#F59E0B', css: '#A78BFA', js: '#22D3EE' }
  const values    = { html, css, js }
  const setters   = { html: setHtml, css: setCss, js: setJs }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0A1220', color: '#F8FAFC', overflow: 'hidden' }}>
      <Navbar username={profile?.username ?? ''} displayName={profile?.display_name} avatarUrl={profile?.avatar_url} currentLevel={stats?.current_level} />

      {/* ── Topbar ── */}
      <div style={{
        height: 50, flexShrink: 0, marginTop: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: '#080F1C', borderBottom: '1px solid #1A2535',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Code2 size={15} color="#22D3EE" strokeWidth={1.75} />
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
            Workshop
          </span>
          <span style={{ fontSize: 11, color: '#334155' }}>— IDE Bebas</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Auto run toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#334155' }}>Auto</span>
            <div onClick={() => setAutoRun(v => !v)} style={{
              width: 34, height: 18, borderRadius: 99,
              background: autoRun ? '#22D3EE' : '#1E2D3D',
              cursor: 'pointer', position: 'relative', transition: 'background .2s',
            }}>
              <div style={{ position: 'absolute', top: 2, left: autoRun ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#F8FAFC', transition: 'left .18s' }} />
            </div>
          </div>

          {/* Template picker */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowTemplates(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 7,
              border: '1px solid #1A2535', background: 'none',
              color: '#475569', cursor: 'pointer', fontSize: 12,
              fontFamily: 'var(--font-inter)',
            }}>
              <Layout size={12} strokeWidth={1.75} /> Template
            </button>
            {showTemplates && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 20,
                background: '#0F1A2E', border: '1px solid #1A2535', borderRadius: 10,
                padding: 6, minWidth: 150,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button key={key} onClick={() => handleTemplate(key)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 12px', borderRadius: 7,
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: '#94A3B8', fontSize: 12, textAlign: 'left',
                    transition: 'all .15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1A2535'; (e.currentTarget as HTMLElement).style.color = '#F1F5F9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#94A3B8' }}
                  >
                    <ChevronRight size={11} strokeWidth={2} /> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleReset} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7,
            border: '1px solid #1A2535', background: 'none',
            color: '#475569', cursor: 'pointer', fontSize: 12,
          }}>
            <RotateCcw size={12} strokeWidth={2} /> Reset
          </button>

          <button onClick={handleDownload} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7,
            border: '1px solid #1A2535', background: 'none',
            color: '#475569', cursor: 'pointer', fontSize: 12,
          }}>
            <Download size={12} strokeWidth={1.75} /> Download
          </button>

          <button onClick={handleRun} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 7,
            border: 'none', background: '#22D3EE',
            color: '#080F1C', cursor: 'pointer', fontSize: 12,
            fontWeight: 700, fontFamily: 'var(--font-geist-mono)',
            boxShadow: '0 0 12px #22D3EE33',
          }}>
            <Play size={12} strokeWidth={2.5} fill="currentColor" /> Run
          </button>
        </div>
      </div>

      {/* ── Main layout: editor kiri, preview+console kanan ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: Editor */}
        {!previewFull && (
          <div style={{ width: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1A2535' }}>
            {/* Tab header */}
            <div style={{ display: 'flex', background: '#080F1C', borderBottom: '1px solid #1A2535', flexShrink: 0 }}>
              {(['html', 'css', 'js'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '9px 20px', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-geist-mono)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: activeTab === tab ? '#070D1A' : 'transparent',
                  color: activeTab === tab ? TAB_COLOR[tab] : '#334155',
                  borderBottom: `2px solid ${activeTab === tab ? TAB_COLOR[tab] : 'transparent'}`,
                  transition: 'all .15s',
                }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Editor */}
            <CodeEditor
              value={values[activeTab]}
              onChange={setters[activeTab]}
              language={activeTab}
            />
          </div>
        )}

        {/* Right: Preview + Console */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Preview */}
          <div style={{ flex: previewFull ? 1 : '0 0 60%', display: 'flex', flexDirection: 'column', borderBottom: previewFull ? 'none' : '1px solid #1A2535' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: '#080F1C', borderBottom: '1px solid #1A2535', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={12} color="#475569" strokeWidth={1.75} />
                <span style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em' }}>PREVIEW</span>
              </div>
              <button onClick={() => setPreviewFull(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 2 }}>
                {previewFull ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
            <iframe
              key={runKey}
              ref={iframeRef}
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-same-origin"
              style={{ flex: 1, border: 'none', background: '#fff' }}
              title="preview"
            />
          </div>

          {/* Console */}
          {!previewFull && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: '#080F1C', borderBottom: '1px solid #1A2535', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Terminal size={12} color="#475569" strokeWidth={1.75} />
                  <span style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em' }}>CONSOLE</span>
                  {consoleLogs.length > 0 && (
                    <span style={{ fontSize: 9, padding: '0 5px', borderRadius: 99, background: '#1A2535', color: '#475569' }}>
                      {consoleLogs.length}
                    </span>
                  )}
                </div>
                <button onClick={() => setConsoleLogs([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155' }}>
                  <X size={11} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', background: '#060C18', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}>
                {consoleLogs.length === 0 ? (
                  <span style={{ color: '#1E2D42' }}>// output console.log() akan muncul di sini</span>
                ) : (
                  consoleLogs.map((log, i) => {
                    const color = log.type === 'error' ? '#F87171' : log.type === 'warn' ? '#FBBF24' : '#94A3B8'
                    const prefix = log.type === 'error' ? '✗' : log.type === 'warn' ? '!' : '›'
                    return (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                        <span style={{ color, flexShrink: 0 }}>{prefix}</span>
                        <span style={{ color, wordBreak: 'break-all', lineHeight: 1.5 }}>
                          {log.args.join(' ')}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside template dropdown */}
      {showTemplates && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowTemplates(false)} />
      )}
    </div>
  )
}