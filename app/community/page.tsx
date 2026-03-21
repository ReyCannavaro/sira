'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, GraduationCap, Key, Users, Plus, Crown, Hash, Zap, Lock } from 'lucide-react'
import Navbar from '@/components/navigation/Navbar'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { formatExp } from '@/lib/utils/format'

/* ─── Types ── */
interface Community { id: string; name: string; description: string | null; type: 'squad' | 'school'; invite_code: string; is_public: boolean; focus_topic: string | null; member_count: number; weekly_exp_total: number; squad_war_rank: number | null; created_at: string; owner_id: string }
interface Membership { role: string; joined_at: string; weekly_exp_contribution: number; community: Community }
interface Profile { username: string; display_name: string; avatar_url: string | null }
interface Stats { current_level: number; total_exp: number }

/* ─── Config ── */
const TYPE_COLOR = { squad: '#22D3EE', school: '#F59E0B' }
const TYPE_LABEL = { squad: 'Squad', school: 'Sekolah' }

/* ─── Shared UI ── */
function Badge({ children, color = '#22D3EE', sm }: { children: React.ReactNode; color?: string; sm?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: sm ? '1px 7px' : '2px 10px', borderRadius: 99,
      border: `1px solid ${color}44`, background: `${color}15`, color,
      fontSize: sm ? 10 : 11, fontFamily: 'var(--font-geist-mono)', fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

function ActionBtn({ children, onClick, color = '#22D3EE', disabled, variant = 'outline' }: {
  children: React.ReactNode; onClick: () => void;
  color?: string; disabled?: boolean; variant?: 'outline' | 'solid' | 'ghost'
}) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '8px 16px', borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12, fontFamily: 'var(--font-geist-mono)', fontWeight: 700,
    transition: 'all .18s', opacity: disabled ? 0.45 : 1,
    border: 'none',
  }
  const styles: Record<string, React.CSSProperties> = {
    solid:   { ...base, background: hov && !disabled ? `${color}ee` : color, color: '#0D1526' },
    outline: { ...base, background: hov && !disabled ? `${color}15` : `${color}0a`, border: `1px solid ${color}44`, color },
    ghost:   { ...base, background: hov && !disabled ? '#1A2535' : 'transparent', border: '1px solid #1A2535', color: '#64748B' },
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={styles[variant]}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  )
}

/* ─── Community Card ── */
function CommunityCard({ membership, onClick }: { membership: Membership; onClick: () => void }) {
  const { community: c, role } = membership
  const col    = TYPE_COLOR[c.type]
  const isLeader = role === 'leader'
  const [hov, setHov] = useState(false)

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#111D35' : '#0D1A2E',
        border: `1px solid ${hov ? col + '44' : col + '1a'}`,
        borderLeft: `3px solid ${col}`,
        borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
        transition: 'all .18s',
        boxShadow: hov ? `0 4px 24px ${col}12` : 'none',
      }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {/* Type icon */}
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${col}15`, border: `1px solid ${col}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.type === 'squad'
                ? <Shield size={14} color={col} strokeWidth={1.75} />
                : <GraduationCap size={14} color={col} strokeWidth={1.75} />
              }
            </div>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
              {c.name}
            </span>
            {isLeader && (
              <div title="Leader" style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: '#F59E0B18', border: '1px solid #F59E0B33',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Crown size={11} color="#F59E0B" strokeWidth={1.75} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={col} sm>{TYPE_LABEL[c.type]}</Badge>
            <Badge color="#475569" sm>
              <Users size={9} strokeWidth={2} /> {c.member_count}
            </Badge>
            {c.squad_war_rank && (
              <Badge color="#A78BFA" sm>
                <Hash size={9} strokeWidth={2} /> {c.squad_war_rank} War
              </Badge>
            )}
          </div>
        </div>

        {/* EXP */}
        <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 2 }}>
            <Zap size={11} color={col} strokeWidth={2} />
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 16, fontWeight: 800, color: col }}>
              {formatExp(c.weekly_exp_total)}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#334155' }}>EXP minggu ini</div>
        </div>
      </div>

      {/* Body */}
      {c.description && (
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: c.focus_topic ? 8 : 0 }}>
          {c.description}
        </p>
      )}
      {c.focus_topic && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 6,
          background: `${col}0a`, border: `1px solid ${col}22`,
        }}>
          <Hash size={9} color={col} strokeWidth={2} />
          <span style={{ fontSize: 10, color: col, fontFamily: 'var(--font-geist-mono)' }}>{c.focus_topic}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Empty State ── */
function EmptyState({ type, userLevel, onJoin, onCreate }: {
  type: 'squad' | 'school'; userLevel: number;
  onJoin: () => void; onCreate: () => void;
}) {
  const col       = TYPE_COLOR[type]
  const minLevel  = type === 'squad' ? 15 : 25
  const canCreate = userLevel >= minLevel

  return (
    <div style={{
      textAlign: 'center', padding: '56px 24px',
      background: '#0D1A2E', borderRadius: 18,
      border: '1px solid #1A2535',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, margin: '0 auto 18px',
        background: `${col}0e`, border: `1px solid ${col}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {type === 'squad'
          ? <Shield size={28} color={col} strokeWidth={1.25} />
          : <GraduationCap size={28} color={col} strokeWidth={1.25} />
        }
      </div>
      <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 6 }}>
        Belum ada {TYPE_LABEL[type]}
      </p>
      <p style={{ fontSize: 13, color: '#475569', marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>
        {type === 'squad'
          ? 'Bergabung atau buat Squad untuk mulai kompetisi mingguan bersama teman.'
          : 'Bergabung atau buat komunitas Sekolah untuk belajar lebih terstruktur.'
        }
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <ActionBtn onClick={onJoin} color="#22D3EE" variant="outline">
          <Key size={13} strokeWidth={2} /> Pakai Kode Undangan
        </ActionBtn>
        {canCreate ? (
          <ActionBtn onClick={onCreate} color={col} variant="solid">
            <Plus size={13} strokeWidth={2} /> Buat {TYPE_LABEL[type]}
          </ActionBtn>
        ) : (
          <ActionBtn onClick={() => {}} color="#334155" variant="ghost" disabled>
            <Lock size={12} strokeWidth={2} /> Buat {TYPE_LABEL[type]} · Level {minLevel}
          </ActionBtn>
        )}
      </div>
    </div>
  )
}

/* ─── Create Modal ── */
function CreateModal({ type, userLevel, onClose, onCreated }: {
  type: 'squad' | 'school'; userLevel: number;
  onClose: () => void; onCreated: () => void;
}) {
  const col      = TYPE_COLOR[type]
  const minLevel = type === 'school' ? 25 : 15
  const [name, setName]       = useState('')
  const [desc, setDesc]       = useState('')
  const [topic, setTopic]     = useState('')
  const [pub, setPub]         = useState(type === 'squad')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return setError('Nama komunitas wajib diisi')
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/communities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined, type, is_public: pub, focus_topic: topic.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error ?? 'Gagal membuat komunitas'); return }
      onCreated()
    } catch { setError('Koneksi gagal') } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0F1A2E', border: `1px solid ${col}33`, borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', animation: 'scale-in .2s ease' }}>
        {/* Top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${col}, ${col}55)` }} />
        <div style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${col}15`, border: `1px solid ${col}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {type === 'squad' ? <Shield size={16} color={col} strokeWidth={1.75} /> : <GraduationCap size={16} color={col} strokeWidth={1.75} />}
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 16, fontWeight: 800, color: '#F1F5F9' }}>
                Buat {TYPE_LABEL[type]}
              </h2>
              <p style={{ fontSize: 11, color: '#334155' }}>Level {minLevel}+ diperlukan · Level kamu: {userLevel}</p>
            </div>
          </div>

          <div style={{ height: 1, background: '#1A2535', margin: '18px 0' }} />

          {[
            { label: 'NAMA *', val: name, set: setName, ph: type === 'squad' ? 'JavaScript Juggernauts' : 'SMKN 1 Coding Class', max: 60 },
            { label: 'DESKRIPSI', val: desc, set: setDesc, ph: 'Ceritakan tentang komunitas ini...', max: 200 },
            { label: 'TOPIK FOKUS', val: topic, set: setTopic, ph: 'React, Python, Algoritma...', max: 50 },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} maxLength={f.max}
                style={{ width: '100%', background: '#080F1C', border: '1px solid #1A2535', borderRadius: 9, padding: '10px 13px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = col}
                onBlur={e => (e.target as HTMLElement).style.borderColor = '#1A2535'} />
            </div>
          ))}

          {type === 'squad' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: '#F1F5F9', marginBottom: 2 }}>Komunitas Publik</div>
                <div style={{ fontSize: 11, color: '#475569' }}>Siapa saja bisa bergabung tanpa kode</div>
              </div>
              <div onClick={() => setPub(!pub)} style={{ width: 42, height: 22, borderRadius: 99, background: pub ? col : '#1E2D3D', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: pub ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#F8FAFC', transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '9px 13px', borderRadius: 9, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #1A2535', background: 'none', color: '#475569', cursor: 'pointer', fontSize: 13 }}>
              Batal
            </button>
            <button onClick={handleCreate} disabled={loading} style={{
              flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
              background: loading ? '#1A2535' : col,
              color: loading ? '#475569' : '#080F1C',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-geist-mono)',
            }}>
              {loading ? 'Membuat...' : `Buat ${TYPE_LABEL[type]}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Join Modal ── */
function JoinModal({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleJoin = async () => {
    if (!code.trim()) return setError('Masukkan kode undangan')
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/communities/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error ?? 'Kode tidak valid'); return }
      onJoined()
    } catch { setError('Koneksi gagal') } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0F1A2E', border: '1px solid #22D3EE33', borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden', animation: 'scale-in .2s ease' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #22D3EE, #22D3EE44)' }} />
        <div style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#22D3EE15', border: '1px solid #22D3EE33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={16} color="#22D3EE" strokeWidth={1.75} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 16, fontWeight: 800, color: '#F1F5F9' }}>Masukkan Kode</h2>
              <p style={{ fontSize: 11, color: '#334155' }}>Minta kode dari leader komunitas</p>
            </div>
          </div>

          <div style={{ height: 1, background: '#1A2535', margin: '18px 0' }} />

          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="XXXXXXXX" maxLength={8}
            style={{
              width: '100%', background: '#080F1C', border: '1px solid #1A2535',
              borderRadius: 10, padding: '14px', color: '#22D3EE',
              fontSize: 22, fontFamily: 'var(--font-geist-mono)', fontWeight: 700,
              outline: 'none', letterSpacing: '0.3em', textAlign: 'center', boxSizing: 'border-box',
              transition: 'border-color .15s',
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = '#22D3EE55'}
            onBlur={e => (e.target as HTMLElement).style.borderColor = '#1A2535'}
          />

          {error && (
            <div style={{ padding: '9px 13px', borderRadius: 9, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', fontSize: 12, marginTop: 10 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #1A2535', background: 'none', color: '#475569', cursor: 'pointer', fontSize: 13 }}>
              Batal
            </button>
            <button onClick={handleJoin} disabled={loading} style={{
              flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
              background: loading ? '#1A2535' : '#22D3EE',
              color: loading ? '#475569' : '#080F1C',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-geist-mono)',
            }}>
              {loading ? 'Bergabung...' : 'Bergabung'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ── */
export default function CommunityPage() {
  const router = useRouter()
  const [profile,     setProfile]     = useState<Profile | null>(null)
  const [stats,       setStats]       = useState<Stats | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeTab,   setActiveTab]   = useState<'squad' | 'school'>('squad')
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState<null | 'join' | 'squad' | 'school'>(null)

  const load = async () => {
    const sb = createSupabaseBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }
    const [profRes, statsRes, commRes] = await Promise.all([
      sb.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).single(),
      sb.from('user_stats').select('current_level, total_exp').eq('user_id', user.id).single(),
      fetch('/api/communities'),
    ])
    setProfile(profRes.data)
    setStats(statsRes.data)
    const commData = await commRes.json()
    setMemberships(commData.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const userLevel = stats?.current_level ?? 1
  const squads    = memberships.filter(m => m.community?.type === 'squad')
  const schools   = memberships.filter(m => m.community?.type === 'school')
  const shown     = activeTab === 'squad' ? squads : schools

  return (
    <div style={{ minHeight: '100vh', background: '#0D1526', color: '#F8FAFC' }}>
      <Navbar username={profile?.username ?? ''} displayName={profile?.display_name} avatarUrl={profile?.avatar_url} currentLevel={stats?.current_level} />

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '80px 24px 48px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 24, fontWeight: 800, color: '#F1F5F9', marginBottom: 4 }}>
              Community Hub
            </h1>
            <p style={{ fontSize: 13, color: '#475569' }}>
              Belajar bersama, tumbuh bersama ·{' '}
              <span style={{ color: '#22D3EE', fontWeight: 600 }}>Level {userLevel}</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <ActionBtn onClick={() => setModal('join')} color="#22D3EE" variant="outline">
              <Key size={13} strokeWidth={2} /> Pakai Kode
            </ActionBtn>
            <ActionBtn
              onClick={() => userLevel >= 15 ? setModal('squad') : undefined}
              color={userLevel >= 15 ? '#22D3EE' : '#334155'}
              variant={userLevel >= 15 ? 'outline' : 'ghost'}
              disabled={userLevel < 15}
            >
              {userLevel >= 15
                ? <><Plus size={13} strokeWidth={2.5} /> Buat Squad</>
                : <><Lock size={12} strokeWidth={2} /> Squad · Lv.15</>
              }
            </ActionBtn>
            <ActionBtn
              onClick={() => userLevel >= 25 ? setModal('school') : undefined}
              color={userLevel >= 25 ? '#F59E0B' : '#334155'}
              variant={userLevel >= 25 ? 'outline' : 'ghost'}
              disabled={userLevel < 25}
            >
              {userLevel >= 25
                ? <><Plus size={13} strokeWidth={2.5} /> Buat Sekolah</>
                : <><Lock size={12} strokeWidth={2} /> Sekolah · Lv.25</>
              }
            </ActionBtn>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#0D1A2E', borderRadius: 12, padding: 4, border: '1px solid #1A2535', width: 'fit-content' }}>
          {(['squad', 'school'] as const).map(t => {
            const active = activeTab === t
            const col    = TYPE_COLOR[t]
            const count  = t === 'squad' ? squads.length : schools.length
            return (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-geist-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.07em', transition: 'all .18s',
                background: active ? col : 'transparent',
                color: active ? '#080F1C' : '#475569',
              }}>
                {t === 'squad'
                  ? <Shield size={12} strokeWidth={2} />
                  : <GraduationCap size={12} strokeWidth={2} />
                }
                {TYPE_LABEL[t].toUpperCase()}
                <span style={{
                  padding: '0 5px', borderRadius: 99, fontSize: 9,
                  background: active ? 'rgba(0,0,0,0.2)' : '#1A2535',
                  color: active ? '#080F1C' : '#475569',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 130, borderRadius: 14 }} />)}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            type={activeTab}
            userLevel={userLevel}
            onJoin={() => setModal('join')}
            onCreate={() => setModal(activeTab)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {shown.map((m, i) => (
              <CommunityCard key={i} membership={m} onClick={() => router.push(`/community/${m.community.id}`)} />
            ))}
          </div>
        )}
      </div>

      {modal === 'join'   && <JoinModal onClose={() => setModal(null)} onJoined={() => { setModal(null); load() }} />}
      {modal === 'squad'  && <CreateModal type="squad"  userLevel={userLevel} onClose={() => setModal(null)} onCreated={() => { setModal(null); load() }} />}
      {modal === 'school' && <CreateModal type="school" userLevel={userLevel} onClose={() => setModal(null)} onCreated={() => { setModal(null); load() }} />}

      <style jsx>{`
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}