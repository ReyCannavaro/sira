"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getLevelProgress } from "@/lib/utils/level";
import { formatExp } from "@/lib/utils/format";
import Navbar from "@/components/navigation/Navbar";
import type { QuestMapData } from "@/types";

interface UserStats {
  current_level:  number;
  total_exp:      number;
  weekly_exp:     number;
  current_streak: number;
}
interface Profile {
  username:     string;
  display_name: string;
  avatar_url:   string | null;
  hero_class:   string | null;
}
type RegionKey = "coastal" | "highlands" | "citadel";

const REGION_META: Record<RegionKey, {
  label: string; color: string; slug: string; subtitle: string;
}> = {
  coastal:   { label: "Coastal Republic", color: "#22D3EE", slug: "coastal-republic",   subtitle: "Web Development"       },
  highlands: { label: "Data Highlands",   color: "#A78BFA", slug: "data-highlands",     subtitle: "Machine Learning & AI" },
  citadel:   { label: "Logic Citadel",    color: "#F59E0B", slug: "logic-citadel",       subtitle: "Computer Science"      },
};

const DIFF_COLOR: Record<string, string> = {
  easy: "#34D399", normal: "#22D3EE", hard: "#A78BFA", expert: "#F59E0B",
};
const DIFF_LABEL: Record<string, string> = {
  easy: "Mudah", normal: "Normal", hard: "Sulit", expert: "Expert",
};

function NeonBadge({ children, color = "#22D3EE", sm }: {
  children: React.ReactNode; color?: string; sm?: boolean;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: sm ? "1px 8px" : "2px 10px",
      borderRadius: 999,
      border: `1px solid ${color}44`, background: `${color}18`, color,
      fontSize: sm ? 10 : 11, fontFamily: "var(--font-geist-mono)", fontWeight: 700,
      letterSpacing: "0.05em",
    }}>
      {children}
    </span>
  );
}

function XPBar({ current, max, color = "#22D3EE", h = 6 }: {
  current: number; max: number; color?: string; h?: number;
}) {
  return (
    <div style={{ width: "100%", background: "#1E293B", borderRadius: 999, height: h, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 999,
        width: `${Math.min((current / max) * 100, 100)}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        boxShadow: `0 0 6px ${color}55`,
        transition: "width 1s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function Shimmer({ h, r = 8 }: { h: number; r?: number }) {
  return <div className="shimmer" style={{ height: h, borderRadius: r }} />;
}

function buildPositions(count: number, viewW = 760): { x: number; y: number }[] {
  const cols  = 10;
  const cellW = viewW / cols;
  const cellH = 74;
  return Array.from({ length: count }, (_, i) => {
    const row  = Math.floor(i / cols);
    const col  = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return { x: cellW * col + cellW / 2, y: 44 + row * cellH };
  });
}

function QuestNode({ quest, pos, color, hovered, selected, onHover, onClick, idx }: {
  quest: QuestMapData; pos: { x: number; y: number };
  color: string; hovered: boolean; selected: boolean;
  onHover: (v: boolean) => void; onClick: () => void; idx: number;
}) {
  const done   = quest.status === "done";
  const active = quest.status === "active";
  const locked = quest.status === "locked";
  const lit    = hovered || selected;
  const r      = 18;

  return (
    <g
      transform={`translate(${pos.x},${pos.y})`}
      style={{
        cursor: locked ? "default" : "pointer",
        animation: `node-pop .45s ${Math.min(idx * 0.022, 1.2)}s both`,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={locked ? undefined : onClick}
    >
      {active && (
        <circle r={r + 9} fill="none" stroke={color} strokeWidth="1"
          opacity="0.18" style={{ animation: "ring-pulse 2.8s ease-in-out infinite" }} />
      )}

      {lit && !locked && (
        <circle r={r + 5} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      )}

      <circle
        r={lit && !locked ? r + 2 : r}
        fill={done ? `${color}22` : active ? `${color}0e` : "#131F33"}
        stroke={locked ? "#263348" : color}
        strokeWidth={locked ? 1 : 1.8}
        strokeDasharray={locked ? "3,3" : undefined}
        style={{
          transition: "r .15s ease",
          filter: !locked ? `drop-shadow(0 0 ${lit ? 9 : 3}px ${color}${lit ? "99" : "44"})` : "none",
        }}
      />

      {done && <circle r={5} fill={color} opacity="0.9" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />}
      {active && <circle r={3.5} fill={color} opacity="0.8" style={{ animation: "ring-pulse 1.8s ease-in-out infinite" }} />}
      {lit && (
        <g>
          <rect x={-54} y={r + 5} width={108} height={22} rx={4}
            fill="rgba(8,14,26,0.97)" stroke={color} strokeWidth="0.7" />
          <text x={0} y={r + 19} textAnchor="middle"
            fontSize={8.5} fill={color}
            fontFamily="var(--font-geist-mono)"
            style={{ userSelect: "none" }}>
            {quest.title.length > 22 ? quest.title.slice(0, 21) + "…" : quest.title}
          </text>
        </g>
      )}
    </g>
  );
}

function RegionMap({ quests, color, selectedId, onSelect }: {
  quests: QuestMapData[]; color: string;
  selectedId: string | null; onSelect: (q: QuestMapData | null) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const viewW  = 760;
  const rows   = Math.ceil(quests.length / 10);
  const viewH  = 44 + rows * 74 + 28;
  const pos    = buildPositions(quests.length, viewW);

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" style={{ display: "block" }}>
      <defs>
        <pattern id={`dot-${color.slice(1)}`} width="38" height="38" patternUnits="userSpaceOnUse">
          <circle cx="19" cy="19" r="0.7" fill="#334155" opacity="0.5" />
        </pattern>
      </defs>
      <rect width={viewW} height={viewH} fill={`url(#dot-${color.slice(1)})`} />

      {[1, 2, 3].map(ch => (
        <g key={ch}>
          <line x1={ch * (viewW / 4)} y1={0} x2={ch * (viewW / 4)} y2={viewH}
            stroke={color} strokeWidth="0.8" strokeDasharray="2,10" opacity="0.1" />
          <text x={ch * (viewW / 4) + 4} y={12}
            fontSize={7.5} fill={color} opacity="0.25" fontFamily="var(--font-geist-mono)">
            CH{ch + 1}
          </text>
        </g>
      ))}
      <text x={6} y={12} fontSize={7.5} fill={color} opacity="0.25" fontFamily="var(--font-geist-mono)">CH1</text>

      {quests.slice(0, -1).map((q, i) => {
        const p1  = pos[i];
        const p2  = pos[i + 1];
        const active = q.status !== "locked" && quests[i + 1]?.status !== "locked";
        if (!p1 || !p2) return null;
        return (
          <line key={i}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={active ? color : "#1E2D3D"}
            strokeWidth={active ? 1.4 : 0.8}
            strokeDasharray={active ? undefined : "3,5"}
            opacity={active ? 0.45 : 0.35}
          />
        );
      })}

      {quests.map((q, i) => (
        <QuestNode
          key={q.id}
          quest={q}
          pos={pos[i] ?? { x: 0, y: 0 }}
          color={color}
          hovered={hoverId === q.id}
          selected={selectedId === q.id}
          onHover={v => setHoverId(v ? q.id : null)}
          onClick={() => onSelect(selectedId === q.id ? null : q)}
          idx={i}
        />
      ))}
    </svg>
  );
}

function QuestPanel({ quest, color, slug, onClose }: {
  quest: QuestMapData; color: string; slug: string; onClose: () => void;
}) {
  const router = useRouter();
  const done   = quest.status === "done";

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      background: "#0F1A2E",
      border: `1px solid ${color}33`,
      animation: "slide-in .2s ease",
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, ${color}33)` }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <NeonBadge color={color} sm>{DIFF_LABEL[quest.difficulty] ?? quest.difficulty}</NeonBadge>
          <NeonBadge color="#34D399" sm>+{quest.exp_reward} EXP</NeonBadge>
          {done && <NeonBadge color="#34D399" sm>Selesai</NeonBadge>}
        </div>

        <p style={{
          fontFamily: "var(--font-geist-mono)", fontSize: 14, fontWeight: 700,
          color: "#F1F5F9", marginBottom: 4, lineHeight: 1.35,
        }}>
          {quest.title}
        </p>
        <p style={{ fontSize: 11, color: "#2D3F55", marginBottom: 14 }}>Quest #{quest.order_index}</p>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            padding: "8px 14px", borderRadius: 9, border: "1px solid #1E2D3D",
            background: "none", color: "#475569", cursor: "pointer", fontSize: 12,
            transition: "all .2s",
          }}>
            Tutup
          </button>
          {done ? (
            <button onClick={() => router.push(`/adventure/${slug}/${quest.slug}`)} style={{
              flex: 1, padding: "8px 0", borderRadius: 9,
              border: `1px solid ${color}55`, background: "transparent",
              color, cursor: "pointer", fontSize: 12, fontWeight: 700,
              fontFamily: "var(--font-geist-mono)",
            }}>
              Kerjakan Ulang
            </button>
          ) : (
            <button onClick={() => router.push(`/adventure/${slug}/${quest.slug}`)} style={{
              flex: 1, padding: "8px 0", borderRadius: 9,
              border: "none", background: color,
              color: "#080E1A", cursor: "pointer", fontSize: 12, fontWeight: 700,
              fontFamily: "var(--font-geist-mono)",
              boxShadow: `0 0 16px ${color}33`,
            }}>
              Mulai Quest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActiveQuestCard({ quest, color, regionSlug, onFocus }: {
  quest: QuestMapData; color: string; regionSlug: string; onFocus: () => void;
}) {
  const router = useRouter();
  return (
    <div
      onClick={onFocus}
      style={{
        padding: "12px 14px", borderRadius: 10, cursor: "pointer",
        background: "#0B1524", border: "1px solid #1A2535",
        transition: "all .18s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}44`;
        (e.currentTarget as HTMLElement).style.background  = "#0F1A2E";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1A2535";
        (e.currentTarget as HTMLElement).style.background  = "#0B1524";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{
          fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700,
          color: "#D1D5DB", lineHeight: 1.35, flex: 1, minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginRight: 8,
        }}>
          {quest.title}
        </p>
        <NeonBadge color={DIFF_COLOR[quest.difficulty] ?? "#94A3B8"} sm>
          {DIFF_LABEL[quest.difficulty] ?? quest.difficulty}
        </NeonBadge>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <NeonBadge color={color} sm>+{quest.exp_reward} EXP</NeonBadge>
        <button
          onClick={e => { e.stopPropagation(); router.push(`/adventure/${regionSlug}/${quest.slug}`); }}
          style={{
            padding: "4px 12px", borderRadius: 7, border: "none",
            background: color, color: "#080E1A",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          Mulai
        </button>
      </div>
    </div>
  );
}

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
        if (!qs) return [];
        return qs.map((q, i) => {
          const done = completedIds.has(q.id);
          const prev = i === 0 || completedIds.has(qs[i - 1].id);
          return {
            id: q.id, slug: q.slug, title: q.title,
            difficulty: q.difficulty, exp_reward: q.exp_reward,
            order_index: q.order_index,
            status: done ? "done" : prev ? "active" : "locked",
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

  const currentMeta    = REGION_META[activeRegion];
  const currentQuests  = questsByRegion[activeRegion];
  const currentColor   = currentMeta.color;
  const totalCurrent   = currentQuests.length || 40;
  const doneCurrent    = doneCounts[activeRegion];

  function regionOfQuest(id: string): RegionKey {
    if (coastalQuests.find(q => q.id === id))   return "coastal";
    if (highlandsQuests.find(q => q.id === id)) return "highlands";
    return "citadel";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "#F8FAFC" }}>
      <Navbar
        username={profile?.username ?? ""}
        displayName={profile?.display_name}
        avatarUrl={profile?.avatar_url}
        currentLevel={stats?.current_level}
      />

      {notice && (
        <div style={{
          position: "fixed", top: 68, left: "50%", transform: "translateX(-50%)",
          zIndex: 50, padding: "9px 20px", borderRadius: 10,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)",
          color: "#F8FAFC", fontSize: 12, fontFamily: "var(--font-geist-mono)",
          animation: "slide-in .3s ease",
        }}>
          {notice}
        </div>
      )}

      <div style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 28px 0" }}>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ animation: "fade-up .45s ease both" }}>
              <h1 style={{ fontFamily: "var(--font-geist-mono)", fontSize: 24, fontWeight: 800, color: "#F1F5F9", marginBottom: 3 }}>
                Adventure Map
              </h1>
              <p style={{ fontSize: 13, color: "#3D4F6A" }}>
                {loading
                  ? "Memuat data..."
                  : `${profile?.display_name ?? profile?.username ?? "Prajurit"} — ${activeAll.length > 0 ? `${activeAll.length} quest aktif` : "Semua quest selesai"}`}
              </p>
            </div>

            {!loading && stats && (
              <div style={{ display: "flex", alignItems: "center", gap: 24, animation: "fade-up .5s ease both" }}>
                {[
                  { label: "EXP",       value: formatExp(stats.total_exp),      color: "#F1F5F9" },
                  { label: "Streak",    value: `${stats.current_streak}d`,       color: "#F59E0B" },
                  { label: "Minggu ini",value: `+${formatExp(stats.weekly_exp)}`, color: "#22D3EE" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#1E2D42", marginBottom: 1 }}>{s.label}</p>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <Shimmer h={56} r={12} />
          ) : stats && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "#111D35", border: "1px solid #1A2535",
              borderRadius: 12, padding: "12px 18px", marginBottom: 20,
              animation: "fade-up .5s ease both",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${currentColor}12`, border: `1.5px solid ${currentColor}33`,
                fontFamily: "var(--font-geist-mono)", fontSize: 18, fontWeight: 800, color: currentColor,
              }}>
                {stats.current_level}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#1E2D42" }}>
                    Level {stats.current_level} → {stats.current_level + 1}
                  </span>
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700, color: currentColor }}>
                    {lvProgress?.percent ?? 0}%
                  </span>
                </div>
                <XPBar current={lvProgress?.currentExp ?? 0} max={lvProgress?.neededExp ?? 500} color={currentColor} h={6} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {(Object.entries(REGION_META) as [RegionKey, typeof REGION_META[RegionKey]][]).map(([key, meta]) => {
              const active  = activeRegion === key;
              const done    = doneCounts[key];
              const total   = questsByRegion[key].length || 40;
              const pct     = Math.round((done / total) * 100);
              return (
                <button
                  key={key}
                  onClick={() => { setActiveRegion(key); setSelectedQuest(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", borderRadius: 10,
                    background: active ? `${meta.color}12` : "#111D35",
                    border: `1px solid ${active ? meta.color + "44" : "#1A2535"}`,
                    boxShadow: active ? `0 0 16px ${meta.color}18` : "none",
                    cursor: "pointer", transition: "all .2s",
                    minWidth: 190,
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: meta.color,
                    boxShadow: active ? `0 0 6px ${meta.color}` : "none",
                    opacity: active ? 1 : 0.4,
                  }} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <p style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700,
                      color: active ? meta.color : "#475569",
                      marginBottom: 2,
                    }}>
                      {meta.label}
                    </p>
                    <p style={{ fontSize: 10, color: "#1E2D42" }}>{meta.subtitle}</p>
                    <div style={{ marginTop: 5, height: 2, background: "#1A2535", borderRadius: 99, overflow: "hidden", width: "100%" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: meta.color, transition: "width .5s ease", borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700, color: active ? meta.color : "#1E2D42", flexShrink: 0 }}>
                    {done}/{total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px 48px", display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0, background: "#0B1524", border: "1px solid #1A2535", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #1A2535" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: currentColor, boxShadow: `0 0 6px ${currentColor}` }} />
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700, color: currentColor }}>
                  {currentMeta.label}
                </span>
                <NeonBadge color={currentColor} sm>{currentMeta.subtitle}</NeonBadge>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  { label: "Aktif",    fill: currentColor },
                  { label: "Selesai",  fill: currentColor + "44" },
                  { label: "Terkunci", fill: "#263348" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.fill }} />
                    <span style={{ fontSize: 10, color: "#1E2D42" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "12px 16px" }}>
              {loading ? (
                <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${currentColor}33`, borderTopColor: currentColor, animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 12, color: "#1E2D42" }}>Memuat peta...</span>
                </div>
              ) : currentQuests.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#1E2D42" }}>Belum ada quest di region ini.</p>
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

          <div style={{ width: 292, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {selectedQuest && (
              <QuestPanel
                quest={selectedQuest}
                color={currentColor}
                slug={REGION_META[regionOfQuest(selectedQuest.id)].slug}
                onClose={() => setSelectedQuest(null)}
              />
            )}

            <div style={{ background: "#0B1524", border: "1px solid #1A2535", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #1A2535" }}>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.08em" }}>
                  QUEST AKTIF
                </span>
                {activeAll.length > 0 && (
                  <NeonBadge color="#22D3EE" sm>{activeAll.length}</NeonBadge>
                )}
              </div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                {loading ? (
                  [1, 2, 3].map(i => <Shimmer key={i} h={80} r={10} />)
                ) : activeAll.length === 0 ? (
                  <div style={{ padding: "28px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#1E2D42" }}>Semua quest selesai.</p>
                  </div>
                ) : (
                  activeAll.map(({ quest, region }) => (
                    <ActiveQuestCard
                      key={quest.id}
                      quest={quest}
                      color={REGION_META[region].color}
                      regionSlug={REGION_META[region].slug}
                      onFocus={() => { setActiveRegion(region); setSelectedQuest(quest); }}
                    />
                  ))
                )}
              </div>
            </div>

            {!loading && (
              <div style={{ background: "#0B1524", border: "1px solid #1A2535", borderRadius: 14, padding: "14px 16px" }}>
                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700, color: "#1E2D42", letterSpacing: "0.12em", marginBottom: 14 }}>
                  PROGRESS REGION
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(Object.entries(REGION_META) as [RegionKey, typeof REGION_META[RegionKey]][]).map(([key, meta]) => {
                    const done  = doneCounts[key];
                    const total = questsByRegion[key].length || 40;
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#3D4F6A" }}>{meta.label}</span>
                          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700, color: meta.color }}>
                            {done}/{total}
                          </span>
                        </div>
                        <XPBar current={done} max={total} color={meta.color} h={4} />
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
        @keyframes fade-up  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(8px);  } to { opacity: 1; transform: translateX(0); } }
        @keyframes node-pop { from { opacity: 0; transform: scale(.25); }      to { opacity: 1; transform: scale(1); } }
        @keyframes ring-pulse { 0%, 100% { opacity: .18; transform: scale(1); } 50% { opacity: .06; transform: scale(1.28); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}