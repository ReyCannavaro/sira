"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Swords, Globe, Database, ChevronRight,
  Loader2, AlertCircle, MapPin, Check,
  Zap, Brain, Code2, BarChart3,
  Network, Layers, Terminal, ArrowRight
} from "lucide-react";

type HeroClassId = "logic_warrior" | "web_mage" | "data_ranger";

interface HeroClass {
  id:          HeroClassId;
  Icon:        React.ElementType;
  name:        string;
  tagline:     string;
  focus:       string;
  startRegion: string;
  regionColor: string;
  accentDark:  string;
  desc:        string;
  skills:      { label: string; Icon: React.ElementType; color: string }[];
  radar:       { label: string; value: number }[];
  difficulty:  { label: string; level: number; max: number }[];
}

const HEROES: HeroClass[] = [
  {
    id: "logic_warrior", Icon: Swords,
    name: "Logic Warrior",
    tagline: "Kuasai logika, taklukkan algoritma",
    focus: "Algoritma & Struktur Data",
    startRegion: "Logic Citadel",
    regionColor: "#F59E0B",
    accentDark: "rgba(245,158,11,0.07)",
    desc: "Pejuang yang memecahkan masalah dengan logika tajam. Dilatih untuk berpikir algoritmik, menguasai struktur data, dan merancang solusi efisien.",
    skills: [
      { label: "Algoritma",      Icon: Brain,     color: "#F59E0B" },
      { label: "Struktur Data",  Icon: Layers,    color: "#FB923C" },
      { label: "Problem Solving",Icon: Zap,       color: "#FBBF24" },
      { label: "Complexity",     Icon: BarChart3,  color: "#F59E0B" },
    ],
    radar: [
      { label: "Logic",    value: 95 },
      { label: "Speed",    value: 60 },
      { label: "Creative", value: 70 },
      { label: "Data",     value: 65 },
      { label: "Build",    value: 50 },
    ],
    difficulty: [
      { label: "Kurva Belajar",  level: 4, max: 5 },
      { label: "Kreativitas",    level: 3, max: 5 },
      { label: "Matematika",     level: 4, max: 5 },
    ],
  },
  {
    id: "web_mage", Icon: Globe,
    name: "Web Mage",
    tagline: "Ciptakan dunia digital dengan sihir kode",
    focus: "HTML / CSS / JavaScript / React",
    startRegion: "Coastal Republic",
    regionColor: "#22D3EE",
    accentDark: "rgba(34,211,238,0.07)",
    desc: "Penyihir yang membangun antarmuka indah dan aplikasi web yang hidup. Menguasai frontend development dari dasar hingga React dan Next.js modern.",
    skills: [
      { label: "HTML & CSS",  Icon: Code2,    color: "#22D3EE" },
      { label: "JavaScript",  Icon: Terminal, color: "#38BDF8" },
      { label: "React",       Icon: Network,  color: "#67E8F9" },
      { label: "UI/UX",       Icon: Layers,   color: "#A5F3FC" },
    ],
    radar: [
      { label: "Logic",    value: 65 },
      { label: "Speed",    value: 85 },
      { label: "Creative", value: 90 },
      { label: "Data",     value: 55 },
      { label: "Build",    value: 95 },
    ],
    difficulty: [
      { label: "Kurva Belajar",  level: 2, max: 5 },
      { label: "Kreativitas",    level: 5, max: 5 },
      { label: "Matematika",     level: 2, max: 5 },
    ],
  },
  {
    id: "data_ranger", Icon: Database,
    name: "Data Ranger",
    tagline: "Temukan pola tersembunyi di balik data",
    focus: "Python & Machine Learning",
    startRegion: "Data Highlands",
    regionColor: "#A78BFA",
    accentDark: "rgba(167,139,250,0.07)",
    desc: "Penjelajah yang mahir membaca pola tersembunyi di balik tumpukan data. Menyelami Python, analisis data, machine learning, dan kecerdasan buatan.",
    skills: [
      { label: "Python",           Icon: Terminal,  color: "#A78BFA" },
      { label: "Data Analysis",    Icon: BarChart3,  color: "#C4B5FD" },
      { label: "Machine Learning", Icon: Brain,     color: "#818CF8" },
      { label: "Neural Networks",  Icon: Network,   color: "#A78BFA" },
    ],
    radar: [
      { label: "Logic",    value: 80 },
      { label: "Speed",    value: 60 },
      { label: "Creative", value: 70 },
      { label: "Data",     value: 98 },
      { label: "Build",    value: 55 },
    ],
    difficulty: [
      { label: "Kurva Belajar",  level: 5, max: 5 },
      { label: "Kreativitas",    level: 4, max: 5 },
      { label: "Matematika",     level: 5, max: 5 },
    ],
  },
];

// ─── PROLOGUE ─────────────────────────────────────────────────────────────────

const LINES = [
  { text: "Di suatu masa...", sub: null },
  { text: "Digital Realm sedang dalam bahaya.", sub: null },
  { text: "Ancaman dari dalam sistem mulai menyebar.", sub: "Kode-kode kuno perlahan membusuk. Dunia digital terancam runtuh." },
  { text: "Hanya satu harapan yang tersisa...", sub: null },
  { text: "Seorang Pahlawan Kode.", sub: "Seseorang yang menguasai ilmu koding dan mampu memulihkan keseimbangan." },
  { text: "Kamu dipilih.", sub: "Perjalananmu dimulai sekarang. Pilih jalanmu, kuasai kekuatanmu." },
];

function Prologue({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= LINES.length) { const t = setTimeout(onDone, 700); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep(s => s + 1), 2300);
    return () => clearTimeout(t);
  }, [step, onDone]);

  const current  = LINES[Math.min(step, LINES.length - 1)];
  const progress = Math.min((step / LINES.length) * 100, 100);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#020810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {Array.from({ length: 90 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 17 + 3) % 100}%`,
            top:  `${(i * 13 + 7) % 100}%`,
            width:  i % 5 === 0 ? 2 : 1,
            height: i % 5 === 0 ? 2 : 1,
            borderRadius: "50%",
            background: i % 3 === 0 ? "#22D3EE" : i % 3 === 1 ? "#A78BFA" : "#F8FAFC",
            opacity: 0.08 + (i % 7) * 0.06,
            animation: `pulse-glow ${2 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i % 8) * 0.35}s`,
          }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 600, padding: "0 32px" }}>
        <div key={step} style={{ minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeUp 0.7s ease both" }}>
          {step < LINES.length && (
            <>
              <p style={{ fontSize: 26, fontWeight: 700, color: "#F1F5F9", fontFamily: "var(--font-geist-mono)", marginBottom: 14, lineHeight: 1.3 }}>
                {current.text}
              </p>
              {current.sub && (
                <p style={{ fontSize: 14, color: "#3D5068", lineHeight: 1.7 }}>{current.sub}</p>
              )}
            </>
          )}
        </div>

        <div style={{ marginTop: 48, width: 120, margin: "48px auto 0" }}>
          <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, transition: "width 0.6s ease", width: `${progress}%`, background: "linear-gradient(90deg, #22D3EE, #A78BFA)", boxShadow: "0 0 8px rgba(34,211,238,0.5)" }} />
          </div>
        </div>

        <button onClick={onDone} style={{ marginTop: 28, background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#1E2D3D", letterSpacing: "0.15em", fontFamily: "var(--font-geist-mono)", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#3D5068")}
          onMouseLeave={e => (e.currentTarget.style.color = "#1E2D3D")}
        >LEWATI</button>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── PENTAGON RADAR CHART ─────────────────────────────────────────────────────

function PentagonChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const size   = 110;
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = 42;
  const levels = 4;
  const n      = data.length;

  // Sudut untuk tiap titik (mulai dari atas, searah jarum jam)
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  // Koordinat titik di level tertentu
  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Grid levels (polygon background)
  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const r = (radius * (l + 1)) / levels;
    return Array.from({ length: n }, (_, i) => pt(i, r))
      .map(p => `${p.x},${p.y}`)
      .join(" ");
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * radius;
    return pt(i, r);
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Spoke lines
  const spokes = Array.from({ length: n }, (_, i) => {
    const outer = pt(i, radius);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {/* Grid polygons */}
      {gridPolygons.map((pts, l) => (
        <polygon key={l} points={pts}
          fill="none"
          stroke={`${color}18`}
          strokeWidth="0.8"
        />
      ))}

      {/* Spokes */}
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={`${color}15`} strokeWidth="0.8"
        />
      ))}

      {/* Data polygon fill */}
      <polygon points={dataPolygon}
        fill={`${color}15`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5}
          fill={color}
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const labelRadius = radius + 14;
        const p = pt(i, labelRadius);
        return (
          <text key={i} x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fill={`${color}88`}
            fontFamily="var(--font-geist-mono)"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── DIFFICULTY DOTS ──────────────────────────────────────────────────────────

function DifficultyRow({ label, level, max, color }: { label: string; level: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span style={{ fontSize: 10, color: "#3D5068", fontFamily: "var(--font-inter)", minWidth: 100 }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: max }, (_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i < level ? color : "rgba(30,41,59,0.6)",
            boxShadow: i < level ? `0 0 5px ${color}88` : "none",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── HERO CARD ──────────────────────────────────────────────────────────────────

function HeroCard({ hero, selected, onSelect }: { hero: HeroClass; selected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;
  const { Icon } = hero;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex", flexDirection: "column",
        borderRadius: 16, padding: "22px 22px 20px",
        cursor: "pointer",
        background: active ? hero.accentDark : "rgba(6,12,24,0.7)",
        border: `1px solid ${active ? `${hero.regionColor}40` : "rgba(30,41,59,0.6)"}`,
        boxShadow: selected
          ? `0 0 40px ${hero.regionColor}15, inset 0 1px 0 ${hero.regionColor}12`
          : active ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
        transform: hovered && !selected ? "translateY(-4px)" : selected ? "scale(1.01)" : "none",
        transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
        height: "100%",
      }}
    >
      {/* Selected check */}
      {selected && (
        <div style={{ position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: hero.regionColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={12} color="#020810" strokeWidth={3} />
        </div>
      )}

      {/* Top shimmer */}
      {selected && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${hero.regionColor}60, transparent)`, borderRadius: "16px 16px 0 0" }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: `${hero.regionColor}15`, border: `1px solid ${hero.regionColor}25`, flexShrink: 0 }}>
          <Icon size={20} color={hero.regionColor} strokeWidth={1.75} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", fontFamily: "var(--font-geist-mono)", marginBottom: 2 }}>{hero.name}</div>
          <div style={{ fontSize: 11, color: hero.regionColor }}>{hero.tagline}</div>
        </div>
      </div>

      {/* Region badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: `${hero.regionColor}10`, border: `1px solid ${hero.regionColor}20`, marginBottom: 12, alignSelf: "flex-start" }}>
        <MapPin size={9} color={hero.regionColor} />
        <span style={{ fontSize: 10, color: hero.regionColor, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.06em" }}>{hero.startRegion}</span>
      </div>

      {/* Desc */}
      <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, marginBottom: 16, flex: 1 }}>{hero.desc}</p>

      {/* ── Skills — berwarna sesuai tema ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, color: "#1E2D42", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.14em", marginBottom: 8 }}>SKILL</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {hero.skills.map(({ label, Icon: SkillIcon, color }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 7,
              background: `${color}10`,
              border: `1px solid ${color}25`,
            }}>
              <SkillIcon size={11} color={color} strokeWidth={1.75} />
              <span style={{ fontSize: 10, color, fontFamily: "var(--font-inter)", fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pentagon Chart + Difficulty side by side ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginTop: "auto" }}>

        {/* Pentagon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: "#1E2D42", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", alignSelf: "flex-start" }}>RADAR</div>
          <PentagonChart data={hero.radar} color={hero.regionColor} />
        </div>

        {/* Difficulty */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#1E2D42", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", marginBottom: 12 }}>KESULITAN</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hero.difficulty.map(d => (
              <DifficultyRow key={d.label} label={d.label} level={d.level} max={d.max} color={hero.regionColor} />
            ))}
          </div>

          {/* Overall difficulty label */}
          <div style={{ marginTop: 14, padding: "6px 10px", borderRadius: 7, background: `${hero.regionColor}08`, border: `1px solid ${hero.regionColor}18`, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: hero.regionColor, boxShadow: `0 0 5px ${hero.regionColor}` }} />
            <span style={{ fontSize: 10, color: hero.regionColor, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.06em" }}>
              {hero.difficulty.reduce((s, d) => s + d.level, 0) >= 12
                ? "EXPERT"
                : hero.difficulty.reduce((s, d) => s + d.level, 0) >= 8
                ? "MENENGAH"
                : "PEMULA FRIENDLY"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARISON TABLE ──────────────────────────────────────────────────────────

function ComparisonTable({ selected }: { selected: HeroClassId | null }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(30,41,59,0.4)" }}>
      {HEROES.map((hero, hi) => (
        <div key={hero.id} style={{
          padding: "14px 16px",
          background: selected === hero.id ? `${hero.regionColor}08` : "rgba(4,9,20,0.5)",
          borderRight: hi < 2 ? "1px solid rgba(30,41,59,0.3)" : "none",
          transition: "background 0.2s",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: hero.regionColor, fontFamily: "var(--font-geist-mono)", marginBottom: 10 }}>{hero.name}</div>
          {[
            { label: "REGION",   value: hero.startRegion },
            { label: "FOKUS",    value: hero.focus       },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: "#1E2D42", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", marginBottom: 2 }}>{row.label}</div>
              <div style={{ fontSize: 10, color: "#3D5068" }}>{row.value}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [showPrologue, setShowPrologue] = useState(true);
  const [selected,     setSelected]     = useState<HeroClassId | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [mounted,      setMounted]      = useState(false);

  const handleDone = useCallback(() => {
    setShowPrologue(false);
    setTimeout(() => setMounted(true), 80);
  }, []);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/profile/hero-class", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero_class: selected }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? "Gagal menyimpan. Coba lagi."); return; }
      router.push("/adventure");
    } catch { setError("Koneksi gagal. Periksa internet kamu."); }
    finally   { setLoading(false); }
  };

  const selectedHero = HEROES.find(h => h.id === selected);

  return (
    <>
      {showPrologue && <Prologue onDone={handleDone} />}

      {!showPrologue && (
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #05090F 0%, #080E1C 50%, #060B17 100%)", position: "relative", overflow: "hidden" }}>
          {/* Background */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", width: 800, height: 800, top: "-20%", left: "-10%", background: "radial-gradient(circle, rgba(34,211,238,0.03) 0%, transparent 65%)", filter: "blur(60px)" }} />
            <div style={{ position: "absolute", width: 700, height: 700, bottom: "-15%", right: "-10%", background: "radial-gradient(circle, rgba(167,139,250,0.03) 0%, transparent 65%)", filter: "blur(60px)" }} />
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.025 }}>
              <defs><pattern id="dot" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="0.8" fill="#94A3B8" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#dot)" />
            </svg>
          </div>

          <div style={{
            position: "relative", zIndex: 1,
            maxWidth: 1080, margin: "0 auto",
            padding: "52px 32px 64px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 99, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)", marginBottom: 20 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22D3EE" }} />
                <span style={{ fontSize: 10, color: "#22D3EE", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.14em" }}>LANGKAH 1 DARI 1 — PILIH HERO CLASS</span>
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#F1F5F9", fontFamily: "var(--font-geist-mono)", marginBottom: 12, lineHeight: 1.15 }}>
                Pilih Jalanmu,{" "}
                <span style={{ background: "linear-gradient(135deg, #22D3EE 30%, #A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Pahlawan
                </span>
              </h1>
              <p style={{ fontSize: 14, color: "#3D5068", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
                Setiap hero memiliki jalur belajar yang unik. Kamu bisa mengeksplorasi semua region nantinya, tapi petualangan dimulai dari satu titik.
              </p>
            </div>

            {/* Hero Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
              {HEROES.map(hero => (
                <HeroCard
                  key={hero.id}
                  hero={hero}
                  selected={selected === hero.id}
                  onSelect={() => setSelected(hero.id)}
                />
              ))}
            </div>

            {/* Comparison */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 9, color: "#1A2535", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.14em", marginBottom: 10, textAlign: "center" }}>PERBANDINGAN SINGKAT</div>
              <ComparisonTable selected={selected} />
            </div>

            {/* CTA */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.18)", color: "#F87171", fontSize: 12 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
              <button
                onClick={handleConfirm}
                disabled={!selected || loading}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "13px 32px", borderRadius: 12,
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.06em",
                  fontFamily: "var(--font-geist-mono)", border: "none",
                  cursor: !selected || loading ? "not-allowed" : "pointer",
                  background: !selected
                    ? "rgba(20,30,48,0.5)"
                    : loading
                    ? "rgba(20,30,48,0.6)"
                    : selectedHero
                    ? `linear-gradient(135deg, ${selectedHero.regionColor}, ${selectedHero.regionColor}BB)`
                    : "linear-gradient(135deg, #22D3EE, #A78BFA)",
                  color: !selected ? "#2A3A50" : "#020810",
                  boxShadow: selected && !loading && selectedHero
                    ? `0 4px 24px ${selectedHero.regionColor}25`
                    : "none",
                  transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Menyimpan pilihan...</>
                  : selected && selectedHero
                  ? <>Mulai sebagai {selectedHero.name} <ArrowRight size={15} strokeWidth={2.5} /></>
                  : <>Pilih Hero Class terlebih dahulu <ChevronRight size={15} /></>
                }
              </button>
              {selected && selectedHero && (
                <p style={{ fontSize: 11, color: "#1E2D42", textAlign: "center" }}>
                  Perjalanan dimulai di{" "}
                  <span style={{ color: selectedHero.regionColor }}>{selectedHero.startRegion}</span>.{" "}
                  Region lain terbuka setelah Level 5.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}