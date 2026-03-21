'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatExp } from '@/lib/utils/format'
import { getLevelProgress } from '@/lib/utils/level'
import Navbar from '@/components/navigation/Navbar'
import { Settings } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Profile {
  id: string; username: string; display_name: string;
  avatar_url: string | null; hero_class: string | null;
  bio: string | null; is_public: boolean; created_at: string;
}
interface Stats {
  total_exp: number; current_level: number; weekly_exp: number;
  quests_completed: number; current_streak: number;
  longest_streak: number; hints_used_total: number; clean_code_avg: number;
}
interface Badge { id: string; slug: string; name: string; description: string; category: string; rarity: string; icon_url: string | null }
interface UserBadge { id: string; earned_at: string; is_featured: boolean; badge: Badge }
interface StreakDay { activity_date: string; quests_done: number; exp_earned: number }
interface Membership { role: string; community: { id: string; name: string; type: string; weekly_exp_total: number; squad_war_rank: number | null } }
interface RecentAttempt { id: string; exp_earned: number; status: string; created_at: string; quest: { title: string; difficulty: string } }

/* ─── Constants ──────────────────────────────────────────────────────────── */
const HERO: Record<string, { label: string; color: string }> = {
  logic_warrior: { label: 'Logic Warrior', color: '#F59E0B' },
  web_mage:      { label: 'Web Mage',      color: '#22D3EE' },
  data_ranger:   { label: 'Data Ranger',   color: '#A78BFA' },
}
const RARITY: Record<string, { color: string; label: string }> = {
  common:    { color: '#64748B', label: 'Common'    },
  rare:      { color: '#22D3EE', label: 'Rare'      },
  epic:      { color: '#A78BFA', label: 'Epic'      },
  legendary: { color: '#F59E0B', label: 'Legendary' },
}
const DIFF_COLOR: Record<string, string> = {
  easy: '#34D399', normal: '#22D3EE', hard: '#A78BFA', expert: '#F59E0B',
}

/* ─── XP Bar ─────────────────────────────────────────────────────────────── */
function XPBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: '#1A2535', borderRadius: 99, height: 5, overflow: 'hidden', width: '100%' }}>
      <div style={{
        height: '100%', borderRadius: 99, width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        boxShadow: `0 0 6px ${color}55`, transition: 'width 1s ease',
      }} />
    </div>
  )
}

/* ─── Activity Heatmap ───────────────────────────────────────────────────── */
function Heatmap({ streaks, color }: { streaks: StreakDay[]; color: string }) {
  const map   = new Map(streaks.map(s => [s.activity_date, s.quests_done]))
  const today = new Date()
  const cells: { date: string; count: number }[] = []
  for (let i = 364; i >= 0; i--) {
    const d   = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    cells.push({ date: key, count: map.get(key) ?? 0 })
  }
  const weeks: { date: string; count: number }[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const bg = (n: number) =>
    n === 0 ? '#131F33' : n === 1 ? `${color}33` : n <= 3 ? `${color}66` : color

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={weeks.length * 14} height={7 * 14} style={{ display: 'block' }}>
        {weeks.map((week, wi) =>
          week.map((cell, di) => (
            <rect key={`${wi}-${di}`}
              x={wi * 14} y={di * 14} width={11} height={11} rx={2.5}
              fill={bg(cell.count)}>
              <title>{cell.date}: {cell.count} quest</title>
            </rect>
          ))
        )}
      </svg>
    </div>
  )
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ username, avatarUrl, size, color }: { username: string; avatarUrl: string | null; size: number; color: string }) {
  const initial = (username || '?')[0].toUpperCase()
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}33, ${color}11)`,
      border: `2.5px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-geist-mono)', fontWeight: 700,
      fontSize: size * 0.38, color,
    }}>
      {initial}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      background: '#0B1524', border: `1px solid ${color}22`,
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 20, fontWeight: 800, color, marginBottom: 3 }}>{value}</p>
      <p style={{ fontSize: 10, color: '#475569', letterSpacing: '0.06em' }}>{label}</p>
    </div>
  )
}

/* ─── Badge Card ─────────────────────────────────────────────────────────── */
function BadgeCard({ ub }: { ub: UserBadge }) {
  const [hov, setHov] = useState(false)
  const r = RARITY[ub.badge.rarity] ?? { color: '#64748B', label: ub.badge.rarity }
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 11,
        background: hov ? '#0F1A2E' : '#0B1524',
        border: `1px solid ${hov ? r.color + '44' : '#1A2535'}`,
        transition: 'all .18s', cursor: 'default',
      }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${r.color}15`, border: `1px solid ${r.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {ub.badge.icon_url ?? '★'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ub.badge.name}
        </p>
        <p style={{ fontSize: 10, color: r.color, fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>
          {r.label}
        </p>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function ProfileClient({ profile, stats, userBadges, streaks, memberships, recentAttempts, isOwner }: {
  profile: Profile; stats: Stats | null;
  userBadges: UserBadge[]; streaks: StreakDay[];
  memberships: Membership[]; recentAttempts: RecentAttempt[];
  isOwner: boolean;
}) {
  const router    = useRouter()
  const hero      = profile.hero_class ? HERO[profile.hero_class] : null
  const color     = hero?.color ?? '#22D3EE'
  const lvProg    = stats ? getLevelProgress(stats.total_exp) : null
  const initial   = (profile.display_name || profile.username || '?')[0].toUpperCase()

  const [tab, setTab] = useState<'badges' | 'history' | 'community'>('badges')

  const featuredBadges = userBadges.filter(ub => ub.is_featured && ub.badge).slice(0, 3)
  const allBadges      = userBadges.filter(ub => ub.badge)

  return (
    <div style={{ minHeight: '100vh', background: '#0D1526', color: '#F8FAFC' }}>
      <Navbar
        username={profile.username}
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
        currentLevel={stats?.current_level}
      />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px 48px' }}>

        {/* ── Hero Card ── */}
        <div style={{
          background: '#111D35', border: `1px solid ${color}22`,
          borderRadius: 20, padding: '28px', marginBottom: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top shimmer */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />

          <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={80} color={color} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 20, fontWeight: 800, color: '#F1F5F9' }}>
                  {profile.display_name}
                </span>
                <span style={{ fontSize: 12, color: '#334155' }}>@{profile.username}</span>
                {hero && (
                  <span style={{
                    padding: '2px 10px', borderRadius: 99,
                    background: `${color}15`, border: `1px solid ${color}33`,
                    fontSize: 11, color, fontFamily: 'var(--font-geist-mono)', fontWeight: 700,
                  }}>{hero.label}</span>
                )}
                {isOwner && (
                  <button onClick={() => router.push('/settings')} style={{
                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 8,
                    border: '1px solid #1E2D3D', background: 'none',
                    color: '#475569', cursor: 'pointer', fontSize: 12, transition: 'all .2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '55'; (e.currentTarget as HTMLElement).style.color = color }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E2D3D'; (e.currentTarget as HTMLElement).style.color = '#475569' }}
                  >
                    <Settings size={12} strokeWidth={1.75} /> Edit Profil
                  </button>
                )}
              </div>

              {profile.bio && (
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, marginBottom: 10, fontStyle: 'italic', maxWidth: 500 }}>
                  {profile.bio}
                </p>
              )}

              <p style={{ fontSize: 11, color: '#263348', marginBottom: 12 }}>
                Bergabung {new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>

              {/* Featured badges */}
              {featuredBadges.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {featuredBadges.map(ub => {
                    const r = RARITY[ub.badge.rarity] ?? { color: '#64748B' }
                    return (
                      <div key={ub.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '3px 10px', borderRadius: 99,
                        background: `${r.color}15`, border: `1px solid ${r.color}33`,
                        fontSize: 11, color: r.color,
                      }}>
                        <span>{ub.badge.icon_url ?? '★'}</span>
                        <span style={{ fontWeight: 600 }}>{ub.badge.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Level + XP bar */}
              <div style={{ maxWidth: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    Level {stats?.current_level ?? 1} · {formatExp(lvProg?.currentExp ?? 0)} / {formatExp(lvProg?.neededExp ?? 500)} EXP
                  </span>
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, fontWeight: 700, color }}>
                    {lvProg?.percent ?? 0}%
                  </span>
                </div>
                <XPBar pct={lvProg?.percent ?? 0} color={color} />
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flexShrink: 0, minWidth: 280 }}>
              <StatCard label="TOTAL EXP"    value={formatExp(stats?.total_exp ?? 0)}          color={color}     />
              <StatCard label="STREAK"       value={`${stats?.current_streak ?? 0}d`}           color="#F59E0B"   />
              <StatCard label="QUEST SELESAI"value={`${stats?.quests_completed ?? 0}`}          color="#34D399"   />
              <StatCard label="EXP MINGGU"   value={`+${formatExp(stats?.weekly_exp ?? 0)}`}    color="#22D3EE"   />
              <StatCard label="CLEAN CODE"   value={`${Math.round(stats?.clean_code_avg ?? 0)}%`} color="#A78BFA" />
              <StatCard label="STREAK BEST"  value={`${stats?.longest_streak ?? 0}d`}           color="#F59E0B"   />
            </div>
          </div>
        </div>

        {/* ── Body Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Heatmap */}
            <div style={{ background: '#111D35', border: '1px solid #1A2535', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                  AKTIVITAS BELAJAR
                </h2>
                <span style={{ fontSize: 11, color: '#334155' }}>365 hari terakhir</span>
              </div>
              <Heatmap streaks={streaks} color={color} />
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                {[
                  { label: 'Streak terpanjang', value: `${stats?.longest_streak ?? 0} hari`, color: '#F59E0B' },
                  { label: 'Hints dipakai',     value: `${stats?.hints_used_total ?? 0}`,    color: '#A78BFA' },
                  { label: 'Avg clean code',    value: `${Math.round(stats?.clean_code_avg ?? 0)}%`, color: '#34D399' },
                ].map(s => (
                  <div key={s.label}>
                    <span style={{ fontSize: 11, color: '#334155' }}>{s.label}: </span>
                    <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ background: '#111D35', border: '1px solid #1A2535', borderRadius: 16, overflow: 'hidden' }}>
              {/* Tab header */}
              <div style={{ display: 'flex', borderBottom: '1px solid #1A2535' }}>
                {(['badges', 'history', 'community'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-geist-mono)', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.07em', transition: 'all .2s',
                    background: tab === t ? `${color}10` : 'transparent',
                    color: tab === t ? color : '#334155',
                    borderBottom: tab === t ? `2px solid ${color}` : '2px solid transparent',
                  }}>
                    {t === 'badges' ? 'BADGE' : t === 'history' ? 'RIWAYAT' : 'KOMUNITAS'}
                    {t === 'badges' && allBadges.length > 0 && (
                      <span style={{ marginLeft: 6, padding: '0 5px', borderRadius: 99, background: `${color}22`, fontSize: 9 }}>
                        {allBadges.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ padding: 16 }}>
                {/* Badges */}
                {tab === 'badges' && (
                  allBadges.length === 0
                    ? <Empty text="Belum ada badge. Selesaikan quest untuk mendapatkan badge!" />
                    : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                        {allBadges.map(ub => <BadgeCard key={ub.id} ub={ub} />)}
                      </div>
                )}

                {/* History */}
                {tab === 'history' && (
                  recentAttempts.length === 0
                    ? <Empty text="Belum ada riwayat quest yang diselesaikan." />
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {recentAttempts.map(a => (
                          <div key={a.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '11px 14px', background: '#0B1524',
                            border: '1px solid #1A2535', borderRadius: 10,
                          }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: '#22D3EE15', border: '1px solid #22D3EE33',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, color: '#22D3EE',
                            }}>✓</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {a.quest?.title ?? 'Quest'}
                              </p>
                              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                <span style={{ fontSize: 10, color: DIFF_COLOR[a.quest?.difficulty] ?? '#94A3B8', fontFamily: 'var(--font-geist-mono)' }}>
                                  {a.quest?.difficulty}
                                </span>
                                <span style={{ fontSize: 10, color: '#334155' }}>
                                  {new Date(a.created_at).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                            </div>
                            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700, color: '#34D399', flexShrink: 0 }}>
                              +{a.exp_earned} EXP
                            </span>
                          </div>
                        ))}
                      </div>
                )}

                {/* Community */}
                {tab === 'community' && (
                  memberships.length === 0
                    ? <Empty text="Belum bergabung ke komunitas manapun." />
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {memberships.map((m, i) => {
                          const col = m.community?.type === 'school' ? '#F59E0B' : '#22D3EE'
                          return (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '12px 16px', background: '#0B1524',
                              border: `1px solid ${col}22`, borderLeft: `3px solid ${col}`,
                              borderRadius: 10,
                            }}>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', marginBottom: 2 }}>{m.community?.name}</p>
                                <p style={{ fontSize: 10, color: col, fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>
                                  {m.community?.type === 'school' ? 'SEKOLAH' : 'SQUAD'} · {m.role === 'leader' ? 'Leader' : 'Member'}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, fontWeight: 700, color: col }}>
                                  {formatExp(m.community?.weekly_exp_total ?? 0)}
                                </p>
                                <p style={{ fontSize: 10, color: '#334155' }}>EXP minggu ini</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Level badge besar */}
            <div style={{
              background: '#111D35', border: `1px solid ${color}22`,
              borderRadius: 16, padding: '20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }} />
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: `${color}15`, border: `2.5px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-geist-mono)', fontSize: 28, fontWeight: 800, color,
                boxShadow: `0 0 24px ${color}33`, marginBottom: 8,
              }}>
                {stats?.current_level ?? 1}
              </div>
              <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Level</p>
              <p style={{ fontSize: 11, color: '#334155', marginBottom: 12 }}>
                {formatExp(stats?.total_exp ?? 0)} EXP total
              </p>
              <div style={{ width: '100%' }}>
                <XPBar pct={lvProg?.percent ?? 0} color={color} />
                <p style={{ fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 5 }}>
                  {formatExp(lvProg?.neededExp ?? 500 - (lvProg?.currentExp ?? 0))} EXP ke level berikutnya
                </p>
              </div>
            </div>

            {/* Stats list */}
            <div style={{ background: '#111D35', border: '1px solid #1A2535', borderRadius: 16, padding: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.12em', marginBottom: 14 }}>
                STATISTIK
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  { label: 'Total EXP',      value: formatExp(stats?.total_exp ?? 0),       color },
                  { label: 'EXP minggu ini', value: `+${formatExp(stats?.weekly_exp ?? 0)}`, color: '#34D399' },
                  { label: 'Quest selesai',  value: `${stats?.quests_completed ?? 0}`,       color: '#22D3EE' },
                  { label: 'Streak aktif',   value: `${stats?.current_streak ?? 0} hari`,    color: '#F59E0B' },
                  { label: 'Streak terbaik', value: `${stats?.longest_streak ?? 0} hari`,    color: '#F59E0B' },
                  { label: 'Avg clean code', value: `${Math.round(stats?.clean_code_avg ?? 0)}%`, color: '#A78BFA' },
                  { label: 'Hints total',    value: `${stats?.hints_used_total ?? 0}`,       color: '#64748B' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>{s.label}</span>
                    <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#334155' }}>{text}</p>
    </div>
  )
}