'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Zap, Shield, GraduationCap, Sword } from 'lucide-react'
import Navbar from '@/components/navigation/Navbar'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { formatExp } from '@/lib/utils/format'

interface Entry {
  rank: number; user_id: string; total_exp: number; current_level: number;
  weekly_exp: number; quests_completed: number;
  username: string; display_name: string; avatar_url: string | null;
  hero_class: string | null; is_me: boolean;
}
interface Profile { username: string; display_name: string; avatar_url: string | null }
interface Stats { current_level: number }

const HERO_COLOR: Record<string, string> = {
  logic_warrior: '#F59E0B',
  web_mage:      '#22D3EE',
  data_ranger:   '#A78BFA',
}
const HERO_LABEL: Record<string, string> = {
  logic_warrior: 'Logic Warrior',
  web_mage:      'Web Mage',
  data_ranger:   'Data Ranger',
}

function HeroIcon({ heroClass, size = 12 }: { heroClass: string | null; size?: number }) {
  const col = heroClass ? HERO_COLOR[heroClass] ?? '#475569' : '#475569'
  if (heroClass === 'logic_warrior') return <Shield size={size} color={col} strokeWidth={1.75} />
  if (heroClass === 'web_mage')      return <Zap     size={size} color={col} strokeWidth={1.75} />
  if (heroClass === 'data_ranger')   return <Trophy  size={size} color={col} strokeWidth={1.75} />
  return null
}

function RankBadge({ rank }: { rank: number }) {
  const medals: Record<number, { color: string; bg: string }> = {
    1: { color: '#F59E0B', bg: '#F59E0B18' },
    2: { color: '#94A3B8', bg: '#94A3B818' },
    3: { color: '#FB923C', bg: '#FB923C18' },
  }
  const medal = medals[rank]
  if (medal) {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: medal.bg, border: `1px solid ${medal.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Medal size={15} color={medal.color} strokeWidth={2} />
      </div>
    )
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12, fontWeight: 700, color: '#334155' }}>
        #{rank}
      </span>
    </div>
  )
}

function Avatar({ entry, size = 40 }: { entry: Entry; size?: number }) {
  const col     = entry.hero_class ? HERO_COLOR[entry.hero_class] ?? '#22D3EE' : '#22D3EE'
  const initial = (entry.display_name || entry.username || '?')[0].toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${col}18`, border: `2px solid ${col}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontFamily: 'var(--font-geist-mono)',
      fontWeight: 700, fontSize: size * 0.4, color: col,
    }}>
      {entry.avatar_url
        ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial
      }
    </div>
  )
}

function EntryRow({ entry, onClick }: { entry: Entry; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const col   = entry.hero_class ? HERO_COLOR[entry.hero_class] ?? '#22D3EE' : '#22D3EE'
  const top3  = entry.rank <= 3
  const isMe  = entry.is_me

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
        marginBottom: 6, transition: 'all .18s',
        background: isMe
          ? hov ? '#22D3EE12' : '#22D3EE08'
          : hov ? '#111D35' : top3 ? '#0F1A2E' : '#0B1524',
        border: `1px solid ${isMe ? '#22D3EE33' : hov ? col + '33' : top3 ? '#1A2D42' : '#1A2535'}`,
      }}
    >
      <RankBadge rank={entry.rank} />
      <Avatar entry={entry} size={38} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{
            fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700,
            color: isMe ? '#22D3EE' : '#F1F5F9',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entry.display_name}
          </span>
          {isMe && (
            <span style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 99,
              background: '#22D3EE18', border: '1px solid #22D3EE33',
              color: '#22D3EE', fontFamily: 'var(--font-geist-mono)', fontWeight: 700,
            }}>KAMU</span>
          )}
          <HeroIcon heroClass={entry.hero_class} size={11} />
        </div>
        <div style={{ fontSize: 11, color: '#334155' }}>
          @{entry.username}
          <span style={{ margin: '0 5px', color: '#1A2535' }}>·</span>
          <span style={{ color: col }}>Lv.{entry.current_level}</span>
          <span style={{ margin: '0 5px', color: '#1A2535' }}>·</span>
          {entry.quests_completed} quest
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-geist-mono)', fontSize: 15, fontWeight: 800,
          color: top3 || isMe ? col : '#94A3B8',
        }}>
          {formatExp(entry.total_exp)}
        </div>
        <div style={{ fontSize: 9, color: '#263348', marginBottom: 1 }}>TOTAL EXP</div>
        {entry.weekly_exp > 0 && (
          <div style={{ fontSize: 10, color: '#34D399', fontFamily: 'var(--font-geist-mono)' }}>
            +{formatExp(entry.weekly_exp)} minggu ini
          </div>
        )}
      </div>
    </div>
  )
}

function Podium({ entries }: { entries: Entry[] }) {
  if (entries.length < 3) return null

  const order  = [entries[1], entries[0], entries[2]]
  const heights = [110, 140, 90]
  const ranks   = [2, 1, 3]

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
      {order.map((e, i) => {
        const col    = e.hero_class ? HERO_COLOR[e.hero_class] ?? '#22D3EE' : '#22D3EE'
        const rank   = ranks[i]
        const height = heights[i]
        const initial = (e.display_name || e.username || '?')[0].toUpperCase()

        return (
          <div key={e.user_id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            flex: 1, maxWidth: 180, gap: 6,
          }}>
            <div style={{
              width: rank === 1 ? 56 : 46, height: rank === 1 ? 56 : 46,
              borderRadius: '50%', background: `${col}22`,
              border: `${rank === 1 ? 3 : 2}px solid ${col}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', fontFamily: 'var(--font-geist-mono)',
              fontWeight: 700, fontSize: rank === 1 ? 22 : 18, color: col,
              boxShadow: rank === 1 ? `0 0 20px ${col}44` : 'none',
            }}>
              {e.avatar_url
                ? <img src={e.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial
              }
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-geist-mono)', fontSize: rank === 1 ? 13 : 11,
                fontWeight: 700, color: col,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 140,
              }}>
                {e.display_name}
              </p>
              <p style={{ fontSize: 10, color: '#334155' }}>Lv.{e.current_level}</p>
            </div>

            <div style={{
              width: '100%', height,
              background: `linear-gradient(180deg, ${col}18 0%, ${col}08 100%)`,
              border: `1px solid ${col}33`,
              borderBottom: 'none',
              borderRadius: '10px 10px 0 0',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', paddingTop: 14, gap: 6,
            }}>
              <RankBadge rank={rank} />
              <span style={{
                fontFamily: 'var(--font-geist-mono)', fontSize: rank === 1 ? 14 : 12,
                fontWeight: 800, color: col,
              }}>
                {formatExp(e.total_exp)}
              </span>
              <span style={{ fontSize: 9, color: '#263348' }}>EXP</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [myRank,  setMyRank]  = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    async function load() {
      const sb = createSupabaseBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [profRes, statsRes, lbRes] = await Promise.all([
        sb.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).single(),
        sb.from('user_stats').select('current_level').eq('user_id', user.id).single(),
        fetch(`/api/leaderboard/global?page=${page}&limit=50`),
      ])

      setProfile(profRes.data)
      setStats(statsRes.data)

      const lbData = await lbRes.json()
      const newEntries = lbData.data?.entries ?? []

      setEntries(prev => page === 1 ? newEntries : [...prev, ...newEntries])
      setMyRank(lbData.data?.my_rank ?? null)
      setHasMore(newEntries.length >= 50)
      setLoading(false)
    }
    load()
  }, [page, router])

  return (
    <div style={{ minHeight: '100vh', background: '#0D1526', color: '#F8FAFC' }}>
      <Navbar
        username={profile?.username ?? ''}
        displayName={profile?.display_name}
        avatarUrl={profile?.avatar_url}
        currentLevel={stats?.current_level}
      />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '80px 24px 48px' }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: '#F59E0B15', border: '1px solid #F59E0B33',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={26} color="#F59E0B" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 26, fontWeight: 800, color: '#F1F5F9', marginBottom: 6 }}>
            Leaderboard Global
          </h1>
          <p style={{ fontSize: 13, color: '#475569' }}>
            Top learner SIRA berdasarkan total EXP
          </p>

          {myRank && !loading && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 14, padding: '7px 18px', borderRadius: 99,
              background: '#22D3EE0a', border: '1px solid #22D3EE33',
            }}>
              <span style={{ fontSize: 12, color: '#475569' }}>Posisi kamu</span>
              <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 16, fontWeight: 800, color: '#22D3EE' }}>
                #{myRank}
              </span>
            </div>
          )}
        </div>

        {!loading && entries.length >= 3 && (
          <Podium entries={entries.slice(0, 3)} />
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 66, borderRadius: 12 }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#334155' }}>
            <p style={{ fontSize: 14 }}>Belum ada data leaderboard.</p>
          </div>
        ) : (
          <>
            {entries.map(e => (
              <EntryRow
                key={e.user_id}
                entry={e}
                onClick={() => e.username && router.push(`/profile/${e.username}`)}
              />
            ))}

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    padding: '10px 28px', borderRadius: 10,
                    border: '1px solid #22D3EE33', background: '#22D3EE0a',
                    color: '#22D3EE', cursor: 'pointer', fontSize: 12,
                    fontFamily: 'var(--font-geist-mono)', fontWeight: 700,
                    transition: 'all .18s',
                  }}
                >
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