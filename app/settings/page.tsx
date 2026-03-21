'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import Navbar from '@/components/navigation/Navbar'
import { Camera, Trash2, Save, Eye, EyeOff, Star, Check, AlertCircle, Loader2, User, FileText, Globe, Shield } from 'lucide-react'

interface Profile {
  id: string; username: string; display_name: string;
  avatar_url: string | null; hero_class: string | null;
  bio: string | null; is_public: boolean;
}
interface Stats { current_level: number; total_exp: number }
interface Badge { id: string; slug: string; name: string; description: string; category: string; rarity: string; icon_url: string | null }
interface UserBadge { id: string; earned_at: string; is_featured: boolean; badge: Badge }

const RARITY_COLOR: Record<string, string> = {
  common: '#64748B', rare: '#22D3EE', epic: '#A78BFA', legendary: '#F59E0B'
}
const HERO_COLOR: Record<string, string> = {
  logic_warrior: '#F59E0B', web_mage: '#22D3EE', data_ranger: '#A78BFA'
}

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#111D35', border: '1px solid #1A2535', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #1A2535' }}>
        <Icon size={15} strokeWidth={1.75} color="#475569" />
        <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.08em' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, maxLength, type = 'text', hint, error, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number; type?: string;
  hint?: string; error?: string; multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? '#F87171' : focused ? '#22D3EE' : '#1A2535'

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 10, color: error ? '#F87171' : focused ? '#22D3EE' : '#475569', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', fontWeight: 700, transition: 'color .15s' }}>
          {label}
        </label>
        {maxLength && (
          <span style={{ fontSize: 10, color: value.length > maxLength * 0.85 ? '#F59E0B' : '#334155' }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: '#080F1C', border: `1px solid ${borderColor}`,
            borderRadius: 10, padding: '10px 13px', color: '#F1F5F9',
            fontSize: 13, fontFamily: 'var(--font-inter)', outline: 'none',
            resize: 'vertical', minHeight: 80, boxSizing: 'border-box',
            transition: 'border-color .15s', lineHeight: 1.6,
          }}
        />
      ) : (
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: '#080F1C', border: `1px solid ${borderColor}`,
            borderRadius: 10, padding: '10px 13px', color: '#F1F5F9',
            fontSize: 13, fontFamily: 'var(--font-inter)', outline: 'none',
            boxSizing: 'border-box', transition: 'border-color .15s',
          }}
        />
      )}
      {hint && !error && <p style={{ fontSize: 11, color: '#334155', marginTop: 5 }}>{hint}</p>}
      {error && (
        <p style={{ fontSize: 11, color: '#F87171', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function Toggle({ value, onChange, label, hint }: {
  value: boolean; onChange: (v: boolean) => void; label: string; hint?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <div>
        <p style={{ fontSize: 13, color: '#F1F5F9', marginBottom: hint ? 2 : 0 }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: '#475569' }}>{hint}</p>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 99, flexShrink: 0,
          background: value ? '#22D3EE' : '#1E2D3D', cursor: 'pointer',
          position: 'relative', transition: 'background .2s',
          boxShadow: value ? '0 0 10px #22D3EE44' : 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
          background: '#F8FAFC', transition: 'left .18s',
          left: value ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, padding: '11px 20px', borderRadius: 12,
      background: type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.1)',
      border: `1px solid ${type === 'success' ? '#34D39944' : '#F8717144'}`,
      color: type === 'success' ? '#34D399' : '#F87171',
      fontSize: 13, fontFamily: 'var(--font-geist-mono)', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'toast-up .3s ease',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap',
    }}>
      {type === 'success' ? <Check size={14} strokeWidth={2.5} /> : <AlertCircle size={14} strokeWidth={2} />}
      {msg}
    </div>
  )
}

export default function SettingsPage() {
  const router     = useRouter()
  const fileRef    = useRef<HTMLInputElement>(null)
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading,    setLoading]    = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [bio,         setBio]         = useState('')
  const [isPublic,    setIsPublic]    = useState(true)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function load() {
      const sb = createSupabaseBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [profRes, statsRes, badgeRes] = await Promise.all([
        sb.from('profiles').select('id, username, display_name, avatar_url, hero_class, bio, is_public').eq('id', user.id).single(),
        sb.from('user_stats').select('current_level, total_exp').eq('user_id', user.id).single(),
        sb.from('user_badges').select('id, earned_at, is_featured, badge:badges(id, slug, name, description, category, rarity, icon_url)').eq('user_id', user.id).order('earned_at', { ascending: false }),
      ])

      if (profRes.data) {
        setProfile(profRes.data)
        setDisplayName(profRes.data.display_name ?? '')
        setBio(profRes.data.bio ?? '')
        setIsPublic(profRes.data.is_public ?? true)
      }
      setStats(statsRes.data)
      setUserBadges((badgeRes.data ?? []) as UserBadge[])
      setLoading(false)
    }
    load()
  }, [router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Ukuran file maksimal 2MB', 'error'); return }
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  const handleAvatarSave = async () => {
    if (!avatarFile) return
    setSavingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', avatarFile)
      const res  = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) { showToast(data.error ?? 'Gagal upload avatar', 'error'); return }
      setProfile(p => p ? { ...p, avatar_url: data.data?.avatar_url } : p)
      setAvatarFile(null)
      setAvatarPreview(null)
      showToast('Avatar berhasil diperbarui')
    } catch { showToast('Koneksi gagal', 'error') }
    finally { setSavingAvatar(false) }
  }

  const handleAvatarRemove = async () => {
    setSavingAvatar(true)
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' })
      if (!res.ok) { showToast('Gagal menghapus avatar', 'error'); return }
      setProfile(p => p ? { ...p, avatar_url: null } : p)
      setAvatarPreview(null)
      setAvatarFile(null)
      showToast('Avatar dihapus')
    } catch { showToast('Koneksi gagal', 'error') }
    finally { setSavingAvatar(false) }
  }

  const handleSave = async () => {
    if (!displayName.trim()) return showToast('Display name tidak boleh kosong', 'error')
    setSaving(true)
    try {
      const res  = await fetch('/api/profile/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName.trim(), bio: bio.trim(), is_public: isPublic }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { showToast(data.error ?? 'Gagal menyimpan', 'error'); return }
      showToast('Profil berhasil disimpan')
    } catch { showToast('Koneksi gagal', 'error') }
    finally { setSaving(false) }
  }

  const toggleFeatured = async (ub: UserBadge) => {
    const nextFeatured = !ub.is_featured
    setUserBadges(prev => prev.map(b => b.id === ub.id ? { ...b, is_featured: nextFeatured } : b))
    try {
      const res  = await fetch('/api/profile/badges/featured', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_badge_id: ub.id, is_featured: nextFeatured }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setUserBadges(prev => prev.map(b => b.id === ub.id ? { ...b, is_featured: ub.is_featured } : b))
        showToast(data.error ?? 'Gagal update badge', 'error')
      } else {
        showToast(nextFeatured ? 'Badge ditambahkan ke unggulan' : 'Badge dihapus dari unggulan')
      }
    } catch {
      setUserBadges(prev => prev.map(b => b.id === ub.id ? { ...b, is_featured: ub.is_featured } : b))
      showToast('Koneksi gagal', 'error')
    }
  }

  const accentColor  = profile?.hero_class ? HERO_COLOR[profile.hero_class] ?? '#22D3EE' : '#22D3EE'
  const initial      = (profile?.display_name || profile?.username || '?')[0].toUpperCase()
  const currentAvatar = avatarPreview ?? profile?.avatar_url
  const featuredCount = userBadges.filter(b => b.is_featured).length
  const validBadges   = userBadges.filter(b => b.badge)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} color="#22D3EE" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D1526', color: '#F8FAFC' }}>
      <Navbar username={profile?.username ?? ''} displayName={profile?.display_name} avatarUrl={profile?.avatar_url} currentLevel={stats?.current_level} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 48px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 22, fontWeight: 800, color: '#F1F5F9', marginBottom: 3 }}>
            Settings
          </h1>
          <p style={{ fontSize: 13, color: '#475569' }}>
            Kelola profil dan preferensi akun kamu
          </p>
        </div>

        <Section title="AVATAR" icon={Camera}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `${accentColor}22`, border: `2.5px solid ${accentColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: `0 0 20px ${accentColor}22`,
              }}>
                {currentAvatar
                  ? <img src={currentAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 700, fontSize: 28, color: accentColor }}>{initial}</span>
                }
              </div>
              {avatarFile && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#F59E0B', border: '2px solid #0D1526',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#080F1C' }} />
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                JPG, PNG, atau WebP · Maks 2MB
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

                {avatarFile ? (
                  <>
                    <button onClick={handleAvatarSave} disabled={savingAvatar} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: '#34D399', color: '#080F1C',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--font-geist-mono)',
                      opacity: savingAvatar ? 0.6 : 1,
                    }}>
                      {savingAvatar ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} strokeWidth={2.5} />}
                      Simpan Avatar
                    </button>
                    <button onClick={() => { setAvatarFile(null); setAvatarPreview(null) }} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1px solid #1A2535',
                      background: 'none', color: '#475569', fontSize: 12, cursor: 'pointer',
                    }}>
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => fileRef.current?.click()} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8,
                      border: `1px solid ${accentColor}44`, background: `${accentColor}0e`,
                      color: accentColor, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--font-geist-mono)',
                    }}>
                      <Camera size={12} strokeWidth={2} /> Ganti Foto
                    </button>
                    {profile?.avatar_url && (
                      <button onClick={handleAvatarRemove} disabled={savingAvatar} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8,
                        border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.06)',
                        color: '#F87171', fontSize: 12, cursor: 'pointer',
                        opacity: savingAvatar ? 0.6 : 1,
                      }}>
                        <Trash2 size={12} strokeWidth={2} /> Hapus
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section title="INFORMASI PROFIL" icon={User}>
          <Field
            label="USERNAME"
            value={profile?.username ?? ''}
            onChange={() => {}}
            hint="Username tidak bisa diubah"
          />
          <Field
            label="DISPLAY NAME"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Nama yang tampil di profil"
            maxLength={50}
            error={displayName.trim().length === 0 ? 'Display name wajib diisi' : undefined}
          />
          <Field
            label="BIO"
            value={bio}
            onChange={setBio}
            placeholder="Ceritakan sedikit tentang dirimu..."
            maxLength={280}
            multiline
          />
        </Section>

        <Section title="PRIVASI" icon={Shield}>
          <Toggle
            value={isPublic}
            onChange={setIsPublic}
            label="Profil Publik"
            hint="Profil dan statistik kamu bisa dilihat pengguna lain"
          />
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9, background: '#080F1C', border: '1px solid #1A2535' }}>
            <p style={{ fontSize: 11, color: '#334155', lineHeight: 1.6 }}>
              {isPublic
                ? 'Profil kamu bisa dilihat siapa saja yang mengetahui username kamu.'
                : 'Profil kamu hanya bisa dilihat oleh dirimu sendiri.'
              }
            </p>
          </div>
        </Section>

        {validBadges.length > 0 && (
          <Section title="BADGE UNGGULAN" icon={Star}>
            <p style={{ fontSize: 12, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
              Pilih hingga <span style={{ color: '#F59E0B', fontWeight: 600 }}>3 badge</span> untuk ditampilkan di profilmu.
              Terpilih: <span style={{ color: '#F59E0B', fontWeight: 600 }}>{featuredCount}/3</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {validBadges.map(ub => {
                const col      = RARITY_COLOR[ub.badge.rarity] ?? '#64748B'
                const featured = ub.is_featured
                const canAdd   = !featured && featuredCount < 3

                return (
                  <div
                    key={ub.id}
                    onClick={() => (featured || canAdd) ? toggleFeatured(ub) : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10, cursor: featured || canAdd ? 'pointer' : 'default',
                      background: featured ? `${col}12` : '#080F1C',
                      border: `1px solid ${featured ? col + '55' : '#1A2535'}`,
                      transition: 'all .18s',
                      opacity: !featured && !canAdd ? 0.4 : 1,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: `${col}18`, border: `1px solid ${col}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17,
                    }}>
                      {ub.badge.icon_url ?? '★'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ub.badge.name}
                      </p>
                      <p style={{ fontSize: 10, color: col, fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>
                        {ub.badge.rarity}
                      </p>
                    </div>
                    {featured && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: col, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} color="#080F1C" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => router.push('/profile')} style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid #1A2535',
            background: 'none', color: '#475569', cursor: 'pointer', fontSize: 13,
          }}>
            Lihat Profil
          </button>
          <button onClick={handleSave} disabled={saving || !displayName.trim()} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: saving || !displayName.trim() ? '#1A2535' : '#22D3EE',
            color: saving || !displayName.trim() ? '#334155' : '#080F1C',
            cursor: saving || !displayName.trim() ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-geist-mono)',
            transition: 'all .18s',
          }}>
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
              : <><Save size={14} strokeWidth={2.5} /> Simpan Perubahan</>
            }
          </button>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <style jsx>{`
        @keyframes spin      { from { transform: rotate(0deg);   } to { transform: rotate(360deg); } }
        @keyframes toast-up  { from { opacity: 0; transform: translateX(-50%) translateY(12px); }
                               to   { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  )
}