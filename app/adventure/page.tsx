"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getLevelProgress } from "@/lib/utils/level";
import { formatExp } from "@/lib/utils/format";
import Navbar from "@/components/navigation/Navbar";
import type { QuestMapData } from "@/types";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface UserStats  { current_level: number; total_exp: number; weekly_exp: number; current_streak: number; }
interface Profile    { username: string; display_name: string; avatar_url: string | null; hero_class: string | null; }
type RegionKey = "coastal" | "highlands" | "citadel";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const REGION_META: Record<RegionKey, { label: string; color: string; slug: string; subtitle: string }> = {
  coastal:   { label: "Coastal Republic", color: "#22D3EE", slug: "coastal-republic", subtitle: "Web Development"       },
  highlands: { label: "Data Highlands",   color: "#A78BFA", slug: "data-highlands",   subtitle: "Machine Learning & AI" },
  citadel:   { label: "Logic Citadel",    color: "#F59E0B", slug: "logic-citadel",    subtitle: "Computer Science"      },
};
const DIFF_COLOR: Record<string, string> = { easy: "#34D399", normal: "#22D3EE", hard: "#A78BFA", expert: "#F59E0B" };
const DIFF_LABEL: Record<string, string> = { easy: "Mudah", normal: "Normal", hard: "Sulit", expert: "Expert" };

/* ─── Shared UI ──────────────────────────────────────────────────────────── */
function NeonBadge({ children, color = "#22D3EE", sm }: { children: React.ReactNode; color?: string; sm?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: sm ? "1px 8px" : "2px 10px", borderRadius: 999,
      border: `1px solid ${color}44`, background: `${color}18`, color,
      fontSize: sm ? 10 : 11, fontFamily: "var(--font-geist-mono)", fontWeight: 700, letterSpacing: "0.05em",
    }}>{children}</span>
  );
}

function XPBar({ current, max, color = "#22D3EE", h = 6 }: { current: number; max: number; color?: string; h?: number }) {
  return (
    <div style={{ width: "100%", background: "#1A2535", borderRadius: 999, height: h, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 999, transition: "width 1s cubic-bezier(.4,0,.2,1)",
        width: `${Math.min((current / max) * 100, 100)}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        boxShadow: `0 0 6px ${color}55`,
      }} />
    </div>
  );
}

function Shimmer({ h, r = 8 }: { h: number; r?: number }) {
  return <div className="shimmer" style={{ height: h, borderRadius: r }} />;
}

/* ─── Map layout ────────────────────────────────────────────────────────── */
const M_COLS  = 6;
const M_GAP_X = 140;  // jarak horizontal antar node
const M_GAP_Y = 130;  // jarak vertikal antar baris — lebih tinggi
const M_PAD_X = 60;
const M_PAD_Y = 60;
// Zigzag: naik-turun per kolom, total range 50px
const M_YOFF  = [0, -25, 15, -15, 25, 0];

function getPos(i: number) {
  const row  = Math.floor(i / M_COLS);
  const col  = i % M_COLS;
  const colX = row % 2 === 0 ? col : M_COLS - 1 - col;
  return {
    x: M_PAD_X + colX * M_GAP_X,
    y: M_PAD_Y + row  * M_GAP_Y + M_YOFF[colX],
  };
}

function getMapSize(count: number) {
  const rows = Math.ceil(count / M_COLS);
  return {
    w: M_PAD_X * 2 + (M_COLS - 1) * M_GAP_X,
    h: M_PAD_Y * 2 + (rows - 1)   * M_GAP_Y + 80,
  };
}

// Garis lurus — polyline points string
function makePolyline(pts: { x: number; y: number }[]): string {
  return pts.map(p => `${p.x},${p.y}`).join(" ");
}

/* ─── Region Map — path SVG + node HTML div ──────────────────────────────── */
function RegionMap({ quests, color, selectedId, onSelect }: {
  quests: QuestMapData[]; color: string;
  selectedId: string | null; onSelect: (q: QuestMapData | null) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const allPos = useMemo(() => quests.map((_, i) => getPos(i)), [quests.length]);
  const { w, h } = getMapSize(quests.length);

  const lastDoneIdx = quests.reduce((acc, q, i) => q.status === "done" ? i : acc, -1);
  const fullPoints  = makePolyline(allPos);
  const donePoints  = lastDoneIdx >= 1 ? makePolyline(allPos.slice(0, lastDoneIdx + 1)) : "";

  return (
    <div style={{ overflowX: "auto", overflowY: "auto" }}>
      {/* Container dengan ukuran pasti */}
      <div style={{ position: "relative", width: w, height: h, minWidth: w }}>

        {/* Layer 1: SVG path di bawah */}
        <svg width={w} height={h}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          <defs>
            <pattern id={`dotbg-${color.replace("#","")}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.8" fill="#1A2D3F" opacity="0.6"/>
            </pattern>
            <filter id={`glow-${color.replace("#","")}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Background dot grid */}
          <rect width={w} height={h} fill={`url(#dotbg-${color.replace("#","")})`}/>

          {/* Full path dim — garis lurus */}
          {fullPoints && (
            <polyline points={fullPoints} fill="none"
              stroke={`${color}1a`} strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"/>
          )}

          {/* Done path neon — garis lurus */}
          {donePoints && <>
            <polyline points={donePoints} fill="none"
              stroke={color} strokeWidth="12"
              strokeLinecap="round" strokeLinejoin="round"
              opacity="0.07" filter={`url(#glow-${color.replace("#","")})`}/>
            <polyline points={donePoints} fill="none"
              stroke={color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              opacity="0.85"/>
            <polyline points={donePoints} fill="none"
              stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </>}
        </svg>

        {/* Layer 2: Node HTML div di atas — TIDAK bisa di-clip */}
        {quests.map((q, i) => {
          const pos    = allPos[i];
          const done   = q.status === "done";
          const active = q.status === "active";
          const locked = q.status === "locked";
          const hov    = hoverId === q.id;
          const sel    = selectedId === q.id;
          const lit    = hov || sel;
          const R      = 22;
          const SIZE   = R * 2;

          return (
            <div
              key={q.id}
              onClick={locked ? undefined : () => onSelect(sel ? null : q)}
              onMouseEnter={() => !locked && setHoverId(q.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{
                position: "absolute",
                left: pos.x - R,
                top:  pos.y - R,
                width:  SIZE,
                height: SIZE,
                borderRadius: "50%",
                cursor: locked ? "default" : "pointer",
                animation: `node-pop .45s ${Math.min(i * 0.03, 1.2)}s both`,
                zIndex: active ? 3 : done ? 2 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                // background
                background: done
                  ? `radial-gradient(circle, ${color}3a 0%, ${color}18 100%)`
                  : active
                  ? `radial-gradient(circle, ${color}22 0%, ${color}0a 100%)`
                  : "#0A1628",
                // border
                border: locked
                  ? "1px dashed #1E293B"
                  : done
                  ? `2.5px solid ${color}`
                  : active
                  ? `2px solid ${color}`
                  : `1.5px solid ${color}55`,
                boxShadow: locked ? "none"
                  : done
                  ? `0 0 14px ${color}66, 0 0 28px ${color}22, inset 0 0 8px ${color}18`
                  : active
                  ? `0 0 10px ${color}55, 0 0 20px ${color}18`
                  : lit
                  ? `0 0 8px ${color}44`
                  : `0 0 4px ${color}22`,
                transition: "box-shadow .2s, transform .15s",
                transform: lit && !locked ? "scale(1.12)" : "scale(1)",
              }}
            >
              {/* Inner icon */}
              {done && (
                <svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
                  <path d={`M ${SIZE*0.28} ${SIZE*0.52} L ${SIZE*0.44} ${SIZE*0.68} L ${SIZE*0.72} ${SIZE*0.34}`}
                    fill="none" stroke={color} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {active && (
                <div style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 8px ${color}, 0 0 16px ${color}88`,
                  animation: "inner-pulse 2s ease-in-out infinite",
                }}/>
              )}
              {locked && (
                <svg width={14} height={16} viewBox="0 0 14 16">
                  <rect x="1" y="7" width="12" height="9" rx="2.5" fill="none" stroke="#263348" strokeWidth="1.5"/>
                  <path d="M 3.5 7 L 3.5 4.5 A 3.5 3.5 0 0 1 10.5 4.5 L 10.5 7"
                    fill="none" stroke="#263348" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}

              {/* Pulse ring active */}
              {active && (
                <div style={{
                  position: "absolute",
                  width: SIZE + 20, height: SIZE + 20,
                  borderRadius: "50%",
                  border: `1px solid ${color}`,
                  opacity: 0.2,
                  animation: "ring-pulse 2.5s ease-in-out infinite",
                  pointerEvents: "none",
                }}/>
              )}

              {/* Nomor quest — di bawah div, absolute */}
              <div style={{
                position: "absolute",
                top: SIZE + 4,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-geist-mono)",
                color: locked ? "#263348" : done ? color : `${color}99`,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}>
                {q.order_index}
              </div>

              {/* Tooltip */}
              {lit && (
                <div style={{
                  position: "absolute",
                  bottom: SIZE + 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(4,9,20,0.97)",
                  border: `1px solid ${color}`,
                  borderRadius: 7,
                  padding: "5px 10px",
                  whiteSpace: "nowrap",
                  fontSize: 10.5,
                  fontWeight: 600,
                  fontFamily: "var(--font-geist-mono)",
                  color,
                  pointerEvents: "none",
                  zIndex: 10,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.5)`,
                }}>
                  {q.title.length > 24 ? q.title.slice(0, 23) + "…" : q.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Quest Panel (sidebar detail) ──────────────────────────────────────── */
function QuestPanel({ quest, color, slug, onClose }: {
  quest: QuestMapData; color: string; slug: string; onClose: () => void;
}) {
  const router = useRouter();
  const done   = quest.status === "done";
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", background: "#0B1524", border: `1px solid ${color}33`, animation: "slide-in .2s ease" }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, ${color}33)` }} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <NeonBadge color={DIFF_COLOR[quest.difficulty] ?? "#94A3B8"} sm>{DIFF_LABEL[quest.difficulty] ?? quest.difficulty}</NeonBadge>
          <NeonBadge color="#34D399" sm>+{quest.exp_reward} EXP</NeonBadge>
          {done && <NeonBadge color="#34D399" sm>Selesai</NeonBadge>}
        </div>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 3, lineHeight: 1.35 }}>
          {quest.title}
        </p>
        <p style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>Quest #{quest.order_index}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid #1E2D3D",
            background: "none", color: "#475569", cursor: "pointer", fontSize: 12, transition: "all .2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1E2D3D"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}
          >Tutup</button>
          {done ? (
            <button onClick={() => router.push(`/adventure/${slug}/${quest.slug}`)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8,
              border: `1px solid ${color}44`, background: "transparent",
              color, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-geist-mono)",
              transition: "all .2s",
            }}>Kerjakan Ulang</button>
          ) : (
            <button onClick={() => router.push(`/adventure/${slug}/${quest.slug}`)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
              background: color, color: "#080E1A", cursor: "pointer",
              fontSize: 12, fontWeight: 700, fontFamily: "var(--font-geist-mono)",
              boxShadow: `0 0 16px ${color}33`, transition: "all .2s",
            }}>Mulai Quest</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Active Quest Card ──────────────────────────────────────────────────── */
function ActiveQuestCard({ quest, color, regionSlug, onFocus }: {
  quest: QuestMapData; color: string; regionSlug: string; onFocus: () => void;
}) {
  const router = useRouter();
  return (
    <div onClick={onFocus} style={{
      padding: "11px 13px", borderRadius: 10, cursor: "pointer",
      background: "#0A1423", border: "1px solid #1A2535", transition: "all .18s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}44`; (e.currentTarget as HTMLElement).style.background = "#0F1A2E"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1A2535";    (e.currentTarget as HTMLElement).style.background = "#0A1423"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: "#D1D5DB", lineHeight: 1.35, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
          {quest.title}
        </p>
        <NeonBadge color={DIFF_COLOR[quest.difficulty] ?? "#94A3B8"} sm>{DIFF_LABEL[quest.difficulty] ?? quest.difficulty}</NeonBadge>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <NeonBadge color={color} sm>+{quest.exp_reward} EXP</NeonBadge>
        <button onClick={e => { e.stopPropagation(); router.push(`/adventure/${regionSlug}/${quest.slug}`); }} style={{
          padding: "4px 12px", borderRadius: 7, border: "none",
          background: color, color: "#080E1A", fontSize: 11, fontWeight: 700,
          cursor: "pointer", fontFamily: "var(--font-geist-mono)",
        }}>Mulai</button>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function AdventurePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [profile,         setProfile]         = useState<Profile | null>(null);
  const [stats,           setStats]           = useState<UserStats | null>(null);
  const [coastalQuests,   setCoastalQuests]   = useState<QuestMapData[]>([]);
  const [highlandsQuests, setHighlandsQuests] = useState<QuestMapData[]>([]);
  const [citadelQuests,   setCitadelQuests]   = useState<QuestMapData[]>([]);
  const [selectedQuest,   setSelectedQuest]   = useState<QuestMapData | null>(null);
  const [activeRegion,    setActiveRegion]    = useState<RegionKey>("coastal");
  const [loading,         setLoading]         = useState(true);
  const [notice,          setNotice]          = useState("");

  useEffect(() => {
    const n = searchParams.get("notice");
    if (n === "leaderboard_locked") {
      setNotice("Leaderboard terbuka di Level 10. Terus belajar!");
      const t = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const sb = createSupabaseBrowserClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [profRes, statsRes, attRes] = await Promise.all([
        sb.from("profiles").select("username,display_name,avatar_url,hero_class").eq("id", user.id).single(),
        sb.from("user_stats").select("current_level,total_exp,weekly_exp,current_streak").eq("user_id", user.id).single(),
        sb.from("quest_attempts").select("quest_id,status").eq("user_id", user.id),
      ]);

      setProfile(profRes.data);
      setStats(statsRes.data);

      // Kumpulkan semua quest_id yang sudah passed (dari semua attempt)
      const completedIds = new Set(
        (attRes.data ?? [])
          .filter(a => a.status === "passed_clean" || a.status === "passed_dirty")
          .map(a => a.quest_id)
      );

      async function fetchRegion(regionSlug: string): Promise<QuestMapData[]> {
        const { data: reg } = await sb.from("regions").select("id").eq("slug", regionSlug).single();
        if (!reg) return [];
        const { data: qs } = await sb.from("quests")
          .select("id,slug,title,difficulty,exp_reward,order_index")
          .eq("region_id", reg.id).eq("is_active", true)
          .order("order_index", { ascending: true });
        if (!qs || qs.length === 0) return [];

        return qs.map((q, i) => {
          const done = completedIds.has(q.id);
          // Quest aktif = belum done, tapi quest sebelumnya (atau ini index 0) sudah done / active
          const prevDone = i === 0 || completedIds.has(qs[i - 1].id);
          const status: "done" | "active" | "locked" = done
            ? "done"
            : prevDone
            ? "active"
            : "locked";
          return {
            id:          q.id,
            slug:        q.slug,
            title:       q.title,
            difficulty:  q.difficulty,
            exp_reward:  q.exp_reward,
            order_index: q.order_index,
            status,
          };
        });
      }

      const [c, h, l] = await Promise.all([
        fetchRegion("coastal-republic"),
        fetchRegion("data-highlands"),
        fetchRegion("logic-citadel"),
      ]);
      setCoastalQuests(c);
      setHighlandsQuests(h);
      setCitadelQuests(l);
      setLoading(false);
    }
    load();
  }, [router]);

  /* ── Derived ── */
  const lvProgress = stats ? getLevelProgress(stats.total_exp) : null;
  const questsByRegion: Record<RegionKey, QuestMapData[]> = {
    coastal: coastalQuests, highlands: highlandsQuests, citadel: citadelQuests,
  };
  const doneCounts: Record<RegionKey, number> = {
    coastal:   coastalQuests.filter(q => q.status === "done").length,
    highlands: highlandsQuests.filter(q => q.status === "done").length,
    citadel:   citadelQuests.filter(q => q.status === "done").length,
  };
  const activeAll = [
    ...coastalQuests.filter(q => q.status === "active").map(q => ({ quest: q, region: "coastal" as RegionKey })),
    ...highlandsQuests.filter(q => q.status === "active").map(q => ({ quest: q, region: "highlands" as RegionKey })),
    ...citadelQuests.filter(q => q.status === "active").map(q => ({ quest: q, region: "citadel" as RegionKey })),
  ];
  const currentMeta   = REGION_META[activeRegion];
  const currentQuests = questsByRegion[activeRegion];
  const currentColor  = currentMeta.color;

  function regionOfQuest(id: string): RegionKey {
    if (coastalQuests.find(q => q.id === id))   return "coastal";
    if (highlandsQuests.find(q => q.id === id)) return "highlands";
    return "citadel";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0D1526", color: "#F8FAFC" }}>
      <Navbar
        username={profile?.username ?? ""}
        displayName={profile?.display_name}
        avatarUrl={profile?.avatar_url}
        currentLevel={stats?.current_level}
      />

      {/* Toast */}
      {notice && (
        <div style={{
          position: "fixed", top: 68, left: "50%", transform: "translateX(-50%)", zIndex: 50,
          padding: "9px 20px", borderRadius: 10,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)",
          color: "#F8FAFC", fontSize: 12, fontFamily: "var(--font-geist-mono)",
          animation: "slide-in .3s ease", whiteSpace: "nowrap",
        }}>{notice}</div>
      )}

      <div style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 0" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ animation: "fade-up .4s ease both" }}>
              <h1 style={{ fontFamily: "var(--font-geist-mono)", fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginBottom: 2 }}>
                Adventure Map
              </h1>
              <p style={{ fontSize: 13, color: "#64748B" }}>
                {loading ? "Memuat..." : `${profile?.display_name ?? profile?.username ?? "Prajurit"} · ${activeAll.length > 0 ? `${activeAll.length} quest aktif` : "Semua quest selesai"}`}
              </p>
            </div>
            {!loading && stats && (
              <div style={{ display: "flex", gap: 20, animation: "fade-up .5s ease both" }}>
                {[
                  { label: "EXP",        value: formatExp(stats.total_exp),       color: "#F1F5F9" },
                  { label: "Streak",     value: `${stats.current_streak}d`,        color: "#F59E0B" },
                  { label: "Minggu ini", value: `+${formatExp(stats.weekly_exp)}`, color: "#22D3EE" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: "#475569", marginBottom: 1 }}>{s.label}</p>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Level bar ── */}
          {loading ? <Shimmer h={52} r={12} /> : stats && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "#111D35", border: "1px solid #1A2535", borderRadius: 12,
              padding: "10px 16px", marginBottom: 16, animation: "fade-up .5s ease both",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${currentColor}12`, border: `1.5px solid ${currentColor}33`,
                fontFamily: "var(--font-geist-mono)", fontSize: 17, fontWeight: 800, color: currentColor,
              }}>{stats.current_level}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "#475569" }}>Level {stats.current_level} → {stats.current_level + 1}</span>
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700, color: currentColor }}>{lvProgress?.percent ?? 0}%</span>
                </div>
                <XPBar current={lvProgress?.currentExp ?? 0} max={lvProgress?.neededExp ?? 500} color={currentColor} h={5} />
              </div>
            </div>
          )}

          {/* ── Region tabs ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {(Object.entries(REGION_META) as [RegionKey, typeof REGION_META[RegionKey]][]).map(([key, meta]) => {
              const active = activeRegion === key;
              const done   = doneCounts[key];
              const total  = questsByRegion[key].length || 40;
              const pct    = Math.round((done / total) * 100);
              return (
                <button key={key} onClick={() => { setActiveRegion(key); setSelectedQuest(null); }} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px", borderRadius: 10, cursor: "pointer", minWidth: 180,
                  background: active ? `${meta.color}12` : "#111D35",
                  border: `1px solid ${active ? meta.color + "44" : "#1A2535"}`,
                  boxShadow: active ? `0 0 14px ${meta.color}16` : "none",
                  transition: "all .2s",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: meta.color, opacity: active ? 1 : 0.35,
                    boxShadow: active ? `0 0 6px ${meta.color}` : "none",
                  }} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700, color: active ? meta.color : "#475569", marginBottom: 1 }}>
                      {meta.label}
                    </p>
                    <p style={{ fontSize: 10, color: "#475569" }}>{meta.subtitle}</p>
                    <div style={{ marginTop: 4, height: 2, background: "#1A2535", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: 99, transition: "width .5s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700, color: active ? meta.color : "#334155", flexShrink: 0 }}>
                    {done}/{total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Map + Sidebar ── */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 48px", display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Map panel */}
          <div style={{ flex: 1, minWidth: 0, background: "#080F1C", border: "1px solid #1A2535", borderRadius: 16 }}>
            {/* Map header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid #1A2535" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: currentColor, boxShadow: `0 0 5px ${currentColor}` }} />
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: currentColor }}>{currentMeta.label}</span>
                <NeonBadge color={currentColor} sm>{currentMeta.subtitle}</NeonBadge>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Aktif",    fill: currentColor },
                  { label: "Selesai",  fill: currentColor + "55" },
                  { label: "Terkunci", fill: "#1E2D42" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.fill }} />
                    <span style={{ fontSize: 10, color: "#475569" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map body */}
            <div>
              {loading ? (
                <div style={{ padding: "70px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${currentColor}33`, borderTopColor: currentColor, animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 12, color: "#475569" }}>Memuat peta...</span>
                </div>
              ) : currentQuests.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#475569" }}>Belum ada quest di region ini.</p>
                </div>
              ) : (
                <RegionMap
                  quests={currentQuests}
                  color={currentColor}
                  selectedId={selectedQuest?.id ?? null}
                  onSelect={setSelectedQuest}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: 284, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Quest detail */}
            {selectedQuest && (
              <QuestPanel
                quest={selectedQuest}
                color={currentColor}
                slug={REGION_META[regionOfQuest(selectedQuest.id)].slug}
                onClose={() => setSelectedQuest(null)}
              />
            )}

            {/* Active quests */}
            <div style={{ background: "#080F1C", border: "1px solid #1A2535", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderBottom: "1px solid #1A2535" }}>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.08em" }}>QUEST AKTIF</span>
                {activeAll.length > 0 && <NeonBadge color="#22D3EE" sm>{activeAll.length}</NeonBadge>}
              </div>
              <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
                {loading ? [1, 2, 3].map(i => <Shimmer key={i} h={76} r={10} />) :
                  activeAll.length === 0 ? (
                    <div style={{ padding: "24px 0", textAlign: "center" }}>
                      <p style={{ fontSize: 12, color: "#475569" }}>Semua quest selesai!</p>
                    </div>
                  ) : activeAll.map(({ quest, region }) => (
                    <ActiveQuestCard
                      key={quest.id} quest={quest}
                      color={REGION_META[region].color}
                      regionSlug={REGION_META[region].slug}
                      onFocus={() => { setActiveRegion(region); setSelectedQuest(quest); }}
                    />
                  ))
                }
              </div>
            </div>

            {/* Progress summary */}
            {!loading && (
              <div style={{ background: "#080F1C", border: "1px solid #1A2535", borderRadius: 14, padding: "13px 14px" }}>
                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: 12 }}>
                  PROGRESS REGION
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(Object.entries(REGION_META) as [RegionKey, typeof REGION_META[RegionKey]][]).map(([key, meta]) => {
                    const d = doneCounts[key];
                    const t = questsByRegion[key].length || 40;
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#64748B" }}>{meta.label}</span>
                          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700, color: meta.color }}>{d}/{t}</span>
                        </div>
                        <XPBar current={d} max={t} color={meta.color} h={3} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-up    { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in   { from { opacity: 0; transform: translateX(8px);  } to { opacity: 1; transform: translateX(0); } }
        @keyframes node-pop   { from { opacity: 0; transform: scale(.2);        } to { opacity: 1; transform: scale(1);    } }
        @keyframes tooltip-in { from { opacity: 0; transform: translateY(3px);  } to { opacity: 1; transform: translateY(0); } }
        @keyframes ring-pulse { 0%, 100% { opacity: .15; transform: scale(1); } 50% { opacity: .04; transform: scale(1.35); } }
        @keyframes inner-pulse{ 0%, 100% { opacity: .95; transform: scale(1); } 50% { opacity: .6;  transform: scale(1.15); } }
        @keyframes spin       { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}