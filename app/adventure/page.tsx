"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getLevelProgress } from "@/lib/utils/level";
import { formatExp } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import Navbar from "@/components/navigation/Navbar";
import type { QuestMapData, RegionWithProgress } from "@/types";

interface UserStats {
  current_level: number;
  total_exp:     number;
  weekly_exp:    number;
  current_streak: number;
}

interface Profile {
  username:     string;
  display_name: string;
  avatar_url:   string | null;
  hero_class:   string | null;
}

type RegionKey = "coastal" | "highlands" | "citadel";

const REGION_META: Record<RegionKey, { label: string; color: string; slug: string }> = {
  coastal:    { label: "Coastal Republic", color: "#22D3EE", slug: "coastal-republic"   },
  highlands:  { label: "Data Highlands",   color: "#A78BFA", slug: "data-highlands"     },
  citadel:    { label: "Logic Citadel",    color: "#F59E0B", slug: "logic-citadel"      },
};

function generateNodePositions(count: number, offsetX: number, baseY: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const spacing = 90;
  const amplitude = 60;

  for (let i = 0; i < count; i++) {
    const x = offsetX + i * spacing;
    const wave = Math.sin((i / (count - 1)) * Math.PI * 3) * amplitude;
    positions.push({ x, y: baseY + wave });
  }
  return positions;
}

const COASTAL_POS   = generateNodePositions(40, 80,  180);
const HIGHLANDS_POS = generateNodePositions(40, 80,  360);
const CITADEL_POS   = generateNodePositions(40, 80,  540);

function NeonBadge({ children, color = "#22D3EE" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider"
      style={{
        border:     `1px solid ${color}33`,
        background: `${color}15`,
        color,
        fontFamily: "var(--font-geist-mono)",
      }}
    >
      {children}
    </span>
  );
}

function XPBar({
  current,
  max,
  color = "#22D3EE",
  height = 6,
}: {
  current: number;
  max:     number;
  color?:  string;
  height?: number;
}) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ background: "#334155", height }}
    >
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width:      `${pct}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow:  `0 0 8px ${color}66`,
        }}
      />
    </div>
  );
}

type NodeStatus = "done" | "active" | "locked";

function QuestNode({
  quest,
  color,
  x,
  y,
  index,
  isHovered,
  isSelected,
  onHover,
  onClick,
}: {
  quest:      QuestMapData;
  color:      string;
  x:          number;
  y:          number;
  index:      number;
  isHovered:  boolean;
  isSelected: boolean;
  onHover:    (v: boolean) => void;
  onClick:    () => void;
}) {
  const status = quest.status as NodeStatus;
  const r      = 20;
  const active = isHovered || isSelected;

  const bgColor =
    status === "done"   ? `${color}33` :
    status === "active" ? "transparent" :
    "transparent";

  const borderColor =
    status === "locked" ? "#475569" : color;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{
        cursor:    status !== "locked" ? "pointer" : "default",
        animation: `node-appear 0.5s ${index * 0.04}s ease both`,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={status !== "locked" ? onClick : undefined}
    >
      {status === "active" && (
        <circle
          r={r + 9}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.25"
          style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        />
      )}

      {active && status !== "locked" && (
        <circle
          r={r + 5}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.4"
        />
      )}

      <circle
        r={active && status !== "locked" ? r + 3 : r}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={status === "locked" ? 1.5 : 2}
        strokeDasharray={status === "locked" ? "4,2" : "none"}
        style={{
          transition: "r 0.15s ease",
          filter:     status !== "locked" && active
            ? `drop-shadow(0 0 10px ${color})`
            : status !== "locked"
            ? `drop-shadow(0 0 4px ${color}66)`
            : "none",
        }}
      />

      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={status === "locked" ? 12 : 14}
        fill={status === "locked" ? "#475569" : color}
        style={{ userSelect: "none" }}
      >
        {status === "done"   ? "✓" :
         status === "active" ? "▶" :
         "🔒"}
      </text>

      {active && (
        <g>
          <rect
            x={-52}
            y={r + 5}
            width={104}
            height={22}
            rx={5}
            fill="rgba(7,15,26,0.97)"
            stroke={color}
            strokeWidth="1"
          />
          <text
            x={0}
            y={r + 19}
            textAnchor="middle"
            fontSize={9}
            fill={color}
            fontFamily="var(--font-geist-mono)"
            style={{ userSelect: "none" }}
          >
            {quest.title.length > 18
              ? quest.title.slice(0, 18) + "…"
              : quest.title}
          </text>
        </g>
      )}
    </g>
  );
}

function AdventureMapSVG({
  coastalQuests,
  highlandsQuests,
  citadelQuests,
  selectedQuest,
  onSelectQuest,
}: {
  coastalQuests:   QuestMapData[];
  highlandsQuests: QuestMapData[];
  citadelQuests:   QuestMapData[];
  selectedQuest:   QuestMapData | null;
  onSelectQuest:   (q: QuestMapData | null) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const svgWidth  = 80 + 39 * 90 + 80;
  const svgHeight = 700;

  function renderConnections(quests: QuestMapData[], positions: { x: number; y: number }[], color: string) {
    return quests.slice(0, -1).map((q, i) => {
      const next   = quests[i + 1];
      const p1     = positions[i];
      const p2     = positions[i + 1];
      const active = q.status !== "locked" && next.status !== "locked";
      return (
        <line
          key={`${q.id}-${next.id}`}
          x1={p1.x} y1={p1.y}
          x2={p2.x} y2={p2.y}
          stroke={active ? color : "#334155"}
          strokeWidth={active ? 1.5 : 1}
          strokeDasharray={active ? "none" : "4,4"}
          opacity={active ? 0.5 : 0.25}
        />
      );
    });
  }

  return (
    <div className="relative" style={{ overflowX: "auto" }}>
      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{ width: 60 }}
      >
        {(
          [
            { label: "WEB", color: "#22D3EE", y: 180 },
            { label: "ML",  color: "#A78BFA", y: 360 },
            { label: "CS",  color: "#F59E0B", y: 540 },
          ] as { label: string; color: string; y: number }[]
        ).map(({ label, color, y }) => (
          <div
            key={label}
            className="absolute text-[10px] font-bold tracking-widest"
            style={{
              top:       y - 8,
              left:      8,
              color,
              fontFamily: "var(--font-geist-mono)",
              writingMode: "vertical-rl",
              transform:  "rotate(180deg)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ display: "block", minWidth: svgWidth }}
      >
        <defs>
          <pattern id="adv-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(71,85,105,0.1)" strokeWidth="1" />
          </pattern>
          <linearGradient id="grad-coastal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-highlands" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-citadel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#adv-grid)" />
        <rect x={0} y={100} width="100%" height={160} fill="url(#grad-coastal)" />
        <rect x={0} y={280} width="100%" height={160} fill="url(#grad-highlands)" />
        <rect x={0} y={460} width="100%" height={160} fill="url(#grad-citadel)" />
        <line x1={0} y1={270} x2="100%" y2={270} stroke="#22D3EE" strokeWidth="1" opacity="0.08" strokeDasharray="6,6" />
        <line x1={0} y1={450} x2="100%" y2={450} stroke="#A78BFA" strokeWidth="1" opacity="0.08" strokeDasharray="6,6" />

        {[0, 1, 2, 3].map((ch) => {
          const x = 80 + ch * 10 * 90 - 40;
          return (
            <g key={ch}>
              <line x1={x} y1={80} x2={x} y2={620} stroke="#334155" strokeWidth="1" strokeDasharray="3,8" opacity="0.4" />
              <text x={x + 8} y={95} fontSize={9} fill="#475569" fontFamily="var(--font-geist-mono)">
                CH{ch + 1}
              </text>
            </g>
          );
        })}

        {renderConnections(coastalQuests,   COASTAL_POS,   "#22D3EE")}
        {renderConnections(highlandsQuests, HIGHLANDS_POS, "#A78BFA")}
        {renderConnections(citadelQuests,   CITADEL_POS,   "#F59E0B")}

        {coastalQuests.map((quest, i) => (
          <QuestNode
            key={quest.id}
            quest={quest}
            color="#22D3EE"
            x={COASTAL_POS[i]?.x ?? 0}
            y={COASTAL_POS[i]?.y ?? 0}
            index={i}
            isHovered={hoveredId === quest.id}
            isSelected={selectedQuest?.id === quest.id}
            onHover={(v) => setHoveredId(v ? quest.id : null)}
            onClick={() => onSelectQuest(quest)}
          />
        ))}

        {highlandsQuests.map((quest, i) => (
          <QuestNode
            key={quest.id}
            quest={quest}
            color="#A78BFA"
            x={HIGHLANDS_POS[i]?.x ?? 0}
            y={HIGHLANDS_POS[i]?.y ?? 0}
            index={i + 40}
            isHovered={hoveredId === quest.id}
            isSelected={selectedQuest?.id === quest.id}
            onHover={(v) => setHoveredId(v ? quest.id : null)}
            onClick={() => onSelectQuest(quest)}
          />
        ))}

        {citadelQuests.map((quest, i) => (
          <QuestNode
            key={quest.id}
            quest={quest}
            color="#F59E0B"
            x={CITADEL_POS[i]?.x ?? 0}
            y={CITADEL_POS[i]?.y ?? 0}
            index={i + 80}
            isHovered={hoveredId === quest.id}
            isSelected={selectedQuest?.id === quest.id}
            onHover={(v) => setHoveredId(v ? quest.id : null)}
            onClick={() => onSelectQuest(quest)}
          />
        ))}
      </svg>
    </div>
  );
}

function QuestDetailPanel({
  quest,
  regionColor,
  onClose,
  onStart,
}: {
  quest:       QuestMapData;
  regionColor: string;
  onClose:     () => void;
  onStart:     () => void;
}) {
  const diffColor: Record<string, string> = {
    easy:   "#34D399",
    normal: "#22D3EE",
    hard:   "#A78BFA",
    expert: "#F59E0B",
  };
  const diffLabel: Record<string, string> = {
    easy:   "Mudah",
    normal: "Normal",
    hard:   "Sulit",
    expert: "Expert",
  };

  return (
    <div
      className="flex items-center justify-between rounded-xl p-5 mt-4"
      style={{
        background:   "#1E293B",
        border:       `1px solid ${regionColor}44`,
        borderLeft:   `3px solid ${regionColor}`,
        animation:    "scale-in 0.2s ease",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span
            className="text-lg font-bold text-ghost-white"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {quest.title}
          </span>
          <NeonBadge color={regionColor}>+{quest.exp_reward} EXP</NeonBadge>
          <NeonBadge color={diffColor[quest.difficulty] ?? "#94A3B8"}>
            {diffLabel[quest.difficulty] ?? quest.difficulty}
          </NeonBadge>
        </div>
        <p className="text-sm text-text-secondary">
          Quest #{quest.order_index} · Klik "Mulai" untuk membuka editor kode
        </p>
      </div>

      <div className="flex items-center gap-3 ml-4 shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-deep-slate hover:text-ghost-white transition-colors"
          style={{ background: "none" }}
        >
          Tutup
        </button>
        <button
          onClick={onStart}
          className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
          style={{
            background: regionColor,
            color:      "#0F172A",
            border:     "none",
            cursor:     "pointer",
            fontFamily: "var(--font-geist-mono)",
            boxShadow:  `0 0 16px ${regionColor}44`,
          }}
        >
          Mulai Quest →
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "#1E293B", border: "1px solid #334155" }}
    >
      <span className="text-xl">{icon}</span>
      <div>
        <div
          className="text-base font-bold"
          style={{ color, fontFamily: "var(--font-geist-mono)" }}
        >
          {value}
        </div>
        <div className="text-xs text-text-muted">{label}</div>
      </div>
    </div>
  );
}

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("rounded-lg shimmer", className)}
      style={{ background: "#1E293B", ...style }}
    />
  );
}

export default function AdventurePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const notice       = searchParams.get("notice");

  const [profile,         setProfile]         = useState<Profile | null>(null);
  const [stats,           setStats]           = useState<UserStats | null>(null);
  const [coastalQuests,   setCoastalQuests]   = useState<QuestMapData[]>([]);
  const [highlandsQuests, setHighlandsQuests] = useState<QuestMapData[]>([]);
  const [citadelQuests,   setCitadelQuests]   = useState<QuestMapData[]>([]);
  const [selectedQuest,   setSelectedQuest]   = useState<QuestMapData | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [activeRegion,    setActiveRegion]    = useState<RegionKey>("coastal");
  const [noticeMsg,       setNoticeMsg]       = useState("");

  useEffect(() => {
    if (notice === "leaderboard_locked") {
      setNoticeMsg("🔒 Leaderboard terbuka di Level 10. Terus belajar!");
      setTimeout(() => setNoticeMsg(""), 4000);
    }
  }, [notice]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, hero_class")
        .eq("id", user.id)
        .single();

      const { data: st } = await supabase
        .from("user_stats")
        .select("current_level, total_exp, weekly_exp, current_streak")
        .eq("user_id", user.id)
        .single();

      setProfile(prof);
      setStats(st);

      const { data: attempts } = await supabase
        .from("quest_attempts")
        .select("quest_id, status")
        .eq("user_id", user.id);

      const completedIds = new Set(
        (attempts ?? [])
          .filter((a) => a.status === "passed_clean" || a.status === "passed_dirty")
          .map((a) => a.quest_id)
      );

      async function fetchRegionQuests(regionSlug: string): Promise<QuestMapData[]> {
        const { data: region } = await supabase
          .from("regions")
          .select("id")
          .eq("slug", regionSlug)
          .single();

        if (!region) return [];

        const { data: quests } = await supabase
          .from("quests")
          .select("id, slug, title, difficulty, exp_reward, order_index, prerequisite_quest_id")
          .eq("region_id", region.id)
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (!quests) return [];

        return quests.map((q, i) => {
          const isDone = completedIds.has(q.id);
          const prevDone = i === 0 || completedIds.has(quests[i - 1].id);
          const status: "done" | "active" | "locked" =
            isDone ? "done" : prevDone ? "active" : "locked";

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

      const [coastal, highlands, citadel] = await Promise.all([
        fetchRegionQuests("coastal-republic"),
        fetchRegionQuests("data-highlands"),
        fetchRegionQuests("logic-citadel"),
      ]);

      setCoastalQuests(coastal);
      setHighlandsQuests(highlands);
      setCitadelQuests(citadel);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const levelProgress = stats ? getLevelProgress(stats.total_exp) : null;
  const mapRef = useRef<HTMLDivElement>(null);

  const completedCounts = {
    coastal:   coastalQuests.filter((q) => q.status === "done").length,
    highlands: highlandsQuests.filter((q) => q.status === "done").length,
    citadel:   citadelQuests.filter((q) => q.status === "done").length,
  };

  const activeQuests = [
    ...coastalQuests.filter((q) => q.status === "active"),
    ...highlandsQuests.filter((q) => q.status === "active"),
    ...citadelQuests.filter((q) => q.status === "active"),
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0F172A", color: "#F8FAFC" }}>
      <Navbar
        username={profile?.username ?? ""}
        displayName={profile?.display_name}
        avatarUrl={profile?.avatar_url}
        currentLevel={stats?.current_level}
      />

      {noticeMsg && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium text-ghost-white"
          style={{
            background:  "rgba(245,158,11,0.15)",
            border:      "1px solid rgba(245,158,11,0.4)",
            animation:   "scale-in 0.3s ease",
            fontFamily:  "var(--font-inter)",
          }}
        >
          {noticeMsg}
        </div>
      )}

      <div className="pt-[60px]">
        <div className="px-8 pt-8 pb-0">
          <div style={{ animation: "fade-up 0.5s ease both" }}>
            <h1
              className="text-3xl font-extrabold text-ghost-white mb-1"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Adventure Map
            </h1>
            <p className="text-sm text-text-secondary">
              {loading
                ? "Memuat data..."
                : `Selamat datang, ${profile?.display_name ?? profile?.username ?? "Prajurit"}! ${
                    activeQuests.length > 0
                      ? `${activeQuests.length} quest menunggumu.`
                      : "Semua quest selesai! 🎉"
                  }`}
            </p>
          </div>

          <div
            className="mt-5 flex items-center justify-between p-5 rounded-xl"
            style={{ background: "#1E293B", border: "1px solid #334155" }}
          >
            {loading ? (
              <>
                <SkeletonBlock style={{ width: 80, height: 40 }} />
                <SkeletonBlock style={{ width: "50%", height: 20 }} />
              </>
            ) : (
              <>
                <div>
                  <div
                    className="text-lg font-bold text-ghost-white mb-1"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    Level {stats?.current_level ?? 1}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatExp(stats?.total_exp ?? 0)} EXP total
                  </div>
                </div>

                <div className="w-[55%]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-secondary">Progress ke Level {(stats?.current_level ?? 1) + 1}</span>
                    <NeonBadge color="#22D3EE">{levelProgress?.percent ?? 0}%</NeonBadge>
                  </div>
                  <XPBar
                    current={levelProgress?.currentExp ?? 0}
                    max={levelProgress?.neededExp ?? 500}
                  />
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <StatCard label="Streak"   value={`${stats?.current_streak ?? 0}🔥`} icon="🔥" color="#F59E0B" />
                  <StatCard label="Minggu ini" value={`+${formatExp(stats?.weekly_exp ?? 0)}`} icon="⚡" color="#22D3EE" />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mt-6 flex-wrap">
            {(Object.entries(REGION_META) as [RegionKey, typeof REGION_META[RegionKey]][]).map(
              ([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setActiveRegion(key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-200",
                    activeRegion === key ? "text-[#0F172A]" : "text-text-muted hover:text-text-secondary"
                  )}
                  style={{
                    fontFamily:  "var(--font-geist-mono)",
                    background:  activeRegion === key ? meta.color : "transparent",
                    border:      `1px solid ${activeRegion === key ? meta.color : "#334155"}`,
                    boxShadow:   activeRegion === key ? `0 0 12px ${meta.color}44` : "none",
                  }}
                >
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: activeRegion === key ? "#0F172A" : meta.color }}
                  >
                    ●
                  </span>
                  {meta.label}
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-md text-[10px]"
                    style={{
                      background: activeRegion === key ? "rgba(0,0,0,0.2)" : `${meta.color}20`,
                      color:      activeRegion === key ? "#0F172A" : meta.color,
                    }}
                  >
                    {completedCounts[key]}/40
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="px-8 mt-6">
          <div
            ref={mapRef}
            className="rounded-2xl overflow-hidden relative"
            style={{
              background:   "#1E293B",
              border:       "1px solid #334155",
              overflowX:    "auto",
            }}
          >
            <div
              className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap"
              style={{ pointerEvents: "none" }}
            >
              {(Object.entries(REGION_META) as [RegionKey, typeof REGION_META[RegionKey]][]).map(
                ([key, meta]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider"
                    style={{
                      background:  "rgba(7,15,26,0.85)",
                      backdropFilter: "blur(8px)",
                      border:      `1px solid ${meta.color}44`,
                      color:       meta.color,
                      fontFamily:  "var(--font-geist-mono)",
                    }}
                  >
                    <span className="text-[8px]">●</span>
                    {meta.label}
                  </div>
                )
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <div
                    className="text-4xl mb-4"
                    style={{ animation: "float 2s ease-in-out infinite" }}
                  >
                    🗺️
                  </div>
                  <p className="text-sm text-text-muted">Memuat adventure map...</p>
                </div>
              </div>
            ) : (
              <AdventureMapSVG
                coastalQuests={coastalQuests}
                highlandsQuests={highlandsQuests}
                citadelQuests={citadelQuests}
                selectedQuest={selectedQuest}
                onSelectQuest={setSelectedQuest}
              />
            )}
          </div>

          <p className="text-center text-xs text-text-muted mt-2">
            ← Geser map untuk melihat semua quest →
          </p>

          {selectedQuest && (
            <QuestDetailPanel
              quest={selectedQuest}
              regionColor={
                coastalQuests.find((q) => q.id === selectedQuest.id)
                  ? "#22D3EE"
                  : highlandsQuests.find((q) => q.id === selectedQuest.id)
                  ? "#A78BFA"
                  : "#F59E0B"
              }
              onClose={() => setSelectedQuest(null)}
              onStart={() => {
                const region = coastalQuests.find((q) => q.id === selectedQuest.id)
                  ? "coastal-republic"
                  : highlandsQuests.find((q) => q.id === selectedQuest.id)
                  ? "data-highlands"
                  : "logic-citadel";
                router.push(`/adventure/${region}/${selectedQuest.slug}`);
              }}
            />
          )}
        </div>

        <div className="px-8 mt-8 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-bold text-ghost-white"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Quest Aktif
            </h2>
            {activeQuests.length > 0 && (
              <NeonBadge color="#22D3EE">{activeQuests.length} tersedia</NeonBadge>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonBlock key={i} style={{ height: 120 }} />
              ))}
            </div>
          ) : activeQuests.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
              style={{ background: "#1E293B", border: "1px solid #334155" }}
            >
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-lg font-bold text-ghost-white mb-2">
                Semua quest selesai!
              </p>
              <p className="text-sm text-text-secondary">
                Kamu sudah menyelesaikan semua quest yang tersedia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeQuests.slice(0, 6).map((quest, i) => {
                const isCoastal   = coastalQuests.find((q) => q.id === quest.id);
                const isHighlands = highlandsQuests.find((q) => q.id === quest.id);
                const col         = isCoastal ? "#22D3EE" : isHighlands ? "#A78BFA" : "#F59E0B";
                const regionSlug  = isCoastal
                  ? "coastal-republic"
                  : isHighlands
                  ? "data-highlands"
                  : "logic-citadel";

                return (
                  <div
                    key={quest.id}
                    className="group rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background:   "#1E293B",
                      border:       `1px solid #334155`,
                      animation:    `fade-up ${0.3 + i * 0.06}s ease both`,
                    }}
                    onClick={() => setSelectedQuest(quest)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${col}55`;
                      (e.currentTarget as HTMLElement).style.boxShadow   = `0 0 20px ${col}15`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#334155";
                      (e.currentTarget as HTMLElement).style.boxShadow   = "none";
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold text-ghost-white mb-1 text-sm leading-snug"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          {quest.title}
                        </div>
                        <div className="text-xs text-text-secondary">
                          Quest #{quest.order_index}
                        </div>
                      </div>
                      <span className="text-lg ml-2">⏱️</span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <NeonBadge color={col}>+{quest.exp_reward} EXP</NeonBadge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/adventure/${regionSlug}/${quest.slug}`);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: col,
                          color:      "#0F172A",
                          border:     "none",
                          cursor:     "pointer",
                          fontFamily: "var(--font-geist-mono)",
                        }}
                      >
                        Mulai →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes node-appear {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}