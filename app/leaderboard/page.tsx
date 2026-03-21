'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/navigation/Navbar'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { formatExp } from '@/lib/utils/format'

interface Entry { rank: number; user_id: string; total_exp: number; current_level: number; weekly_exp: number; quests_completed: number; username: string; display_name: string; avatar_url: string | null; hero_class: string | null; is_me: boolean }
interface Profile { username: string; display_name: string; avatar_url: string | null }
interface Stats { current_level: number }

const HERO_COLOR: Record<string, string> = { logic_warrior: '#F59E0B', web_mage: '#22D3EE', data_ranger: '#A78BFA' }
const HERO_ICON:  Record<string, string> = { logic_warrior: '⚔️', web_mage: '🧙', data_ranger: '🏹' }

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: 20 }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: 20 }}>🥉</span>
  return <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700, color: '#475569', minWidth: 24, textAlign: 'center' }}>#{rank}</span>
}

function EntryRow({ entry, onClick }: { entry: Entry; onClick: () => void }) {
  const heroColor = entry.hero_class ? HERO_COLOR[entry.hero_class] ?? '#22D3EE' : '#22D3EE'
  const initial   = (entry.display_name || entry.username || '?')[0].toUpperCase()
  const top3      = entry.rank <= 3

  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderRadius: 12, background: entry.is_me ? '#22D3EE08' : top3 ? '#1A2535' : '#111D35', border: `1px solid ${entry.is_me ? '#22D3EE33' : top3 ? '#2D3F55' : '#1A2535'}`, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 8 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = entry.is_me ? '#22D3EE12' : '#1A2535'; (e.currentTarget as HTMLElement).style.borderColor = `${heroColor}33` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = entry.is_me ? '#22D3EE08' : top3 ? '#1A2535' : '#111D35'; (e.currentTarget as HTMLElement).style.borderColor = entry.is_me ? '#22D3EE33' : top3 ? '#2D3F55' : '#1A2535' }}>

      <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <RankMedal rank={entry.rank} />
      </div>

      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: `${heroColor}22`, border: `2px solid ${heroColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: heroColor, fontFamily: 'var(--font-geist-mono)', overflow: 'hidden' }}>
        {entry.avatar_url ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 14, fontWeight: 700, color: entry.is_me ? '#22D3EE' : '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.display_name}
          </span>
          {entry.is_me && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: '#22D3EE18', border: '1px solid #22D3EE33', color: '#22D3EE', fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>KAMU</span>}
          {entry.hero_class && <span style={{ fontSize: 12 }}>{HERO_ICON[entry.hero_class] ?? ''}</span>}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
          @{entry.username} · <span style={{ color: heroColor }}>Level {entry.current_level}</span> · {entry.quests_completed} quest
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 16, fontWeight: 800, color: top3 || entry.is_me ? heroColor : '#F8FAFC' }}>
          {formatExp(entry.total_exp)}
        </div>
        <div style={{ fontSize: 10, color: '#2D3F55' }}>EXP</div>
        {entry.weekly_exp > 0 && (
          <div style={{ fontSize: 10, color: '#34D399', fontFamily: 'var(--font-geist-mono)' }}>+{formatExp(entry.weekly_exp)} / minggu</div>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [entries,   setEntries]   = useState<Entry[]>([])
  const [myRank,    setMyRank]    = useState<number | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(1)
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null

  useEffect(() => {
    async function load() {
      const sb = createSupabaseBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return

      const [profRes, statsRes, lbRes] = await Promise.all([
        sb.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).single(),
        sb.from('user_stats').select('current_level').eq('user_id', user.id).single(),
        fetch(`/api/leaderboard/global?page=${page}&limit=50`),
      ])

      setProfile(profRes.data)
      setStats(statsRes.data)
      const lbData = await lbRes.json()
      setEntries(lbData.data?.entries ?? [])
      setMyRank(lbData.data?.my_rank ?? null)
      setLoading(false)
    }
    load()
  }, [page])

  const top3    = entries.slice(0, 3)
  const rest    = entries.slice(3)

  return (
    <div style={{ minHeight: '100vh', background: '#0D1526', color: '#F8FAFC' }}>
      <Navbar username={profile?.username ?? ''} displayName={profile?.display_name} avatarUrl={profile?.avatar_url} currentLevel={stats?.current_level} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '80px 24px 48px' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 28, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>Leaderboard Global</h1>
          <p style={{ fontSize: 13, color: '#475569' }}>Top learner platform SIRA berdasarkan total EXP</p>
          {myRank && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '8px 20px', borderRadius: 99, background: '#22D3EE12', border: '1px solid #22D3EE33' }}>
              <span style={{ fontSize: 12, color: '#22D3EE' }}>Posisi kamu saat ini:</span>
              <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 16, fontWeight: 800, color: '#22D3EE' }}>#{myRank}</span>
            </div>
          )}
        </div>

        {!loading && top3.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
            {[top3[1], top3[0], top3[2]].map((e, i) => {
              const height = i === 1 ? 160 : 120
              const col    = e.hero_class ? HERO_COLOR[e.hero_class] ?? '#22D3EE' : '#22D3EE'
              const initial = (e.display_name || e.username || '?')[0].toUpperCase()
              return (
                <div key={e.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, maxWidth: 200 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${col}22`, border: `2.5px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: col, fontFamily: 'var(--font-geist-mono)', overflow: 'hidden' }}>
                    {e.avatar_url ? <img src={e.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: 'var(--font-geist-mono)' }}>{e.display_name}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>Level {e.current_level}</div>
                  </div>
                  <div style={{ width: '100%', height, background: `${col}18`, border: `1px solid ${col}33`, borderRadius: '10px 10px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 12 }}>
                    <RankMedal rank={e.rank} />
                    <div style={{ marginTop: 6, fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 800, color: col }}>{formatExp(e.total_exp)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {loading ? (
          [...Array(10)].map((_, i) => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 12, marginBottom: 8 }} />)
        ) : (
          <>
            {entries.map(e => (
              <EntryRow key={e.user_id} entry={e} onClick={() => e.username && window.open(`/profile/${e.username}`, '_blank')} />
            ))}
            {entries.length >= 50 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={() => setPage(p => p + 1)} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #22D3EE44', background: '#22D3EE12', color: '#22D3EE', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>
                  Muat lebih banyak
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}