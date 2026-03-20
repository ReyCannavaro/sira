"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type HeroClassId = "logic_warrior" | "web_mage" | "data_ranger";

interface HeroClass {
  id:          HeroClassId;
  icon:        string;
  name:        string;
  tagline:     string;
  focus:       string;
  startRegion: string;
  regionColor: string;
  desc:        string;
  skills:      string[];
  quests:      string[];
  gradient:    string;
  border:      string;
  glow:        string;
}

const HERO_CLASSES: HeroClass[] = [
  {
    id:          "logic_warrior",
    icon:        "⚔️",
    name:        "Logic Warrior",
    tagline:     "Kuasai logika, taklukkan algoritma",
    focus:       "Algoritma & Struktur Data",
    startRegion: "Logic Citadel",
    regionColor: "#F59E0B",
    desc:        "Kamu adalah pejuang yang memecahkan masalah dengan logika tajam. Jalur ini melatih kemampuan berpikir algoritmik, struktur data, dan pemecahan masalah kompleks.",
    skills:      ["Algoritma", "Struktur Data", "Problem Solving", "Complexity"],
    quests:      ["Binary Search", "Sorting Algorithms", "Linked Lists", "Dynamic Programming"],
    gradient:    "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))",
    border:      "#F59E0B",
    glow:        "rgba(245,158,11,0.3)",
  },
  {
    id:          "web_mage",
    icon:        "🧙",
    name:        "Web Mage",
    tagline:     "Ciptakan dunia digital dengan sihir kode",
    focus:       "HTML / CSS / JS / React",
    startRegion: "Coastal Republic",
    regionColor: "#22D3EE",
    desc:        "Kamu adalah penyihir yang membangun antarmuka indah dan aplikasi web yang hidup. Jalur ini mencakup frontend development dari dasar hingga React modern.",
    skills:      ["HTML & CSS", "JavaScript", "React", "UI/UX"],
    quests:      ["Hello World", "Flexbox Sorcery", "React Components", "State Management"],
    gradient:    "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.03))",
    border:      "#22D3EE",
    glow:        "rgba(34,211,238,0.3)",
  },
  {
    id:          "data_ranger",
    icon:        "🏹",
    name:        "Data Ranger",
    tagline:     "Jelajahi hutan data, temukan pola tersembunyi",
    focus:       "Python & AI / ML",
    startRegion: "Data Highlands",
    regionColor: "#A78BFA",
    desc:        "Kamu adalah penjelajah yang mahir membaca pola tersembunyi di balik tumpukan data. Jalur ini membawamu menyelami dunia Python, machine learning, dan kecerdasan buatan.",
    skills:      ["Python", "Data Analysis", "Machine Learning", "Neural Networks"],
    quests:      ["Python Basics", "NumPy & Pandas", "ML Fundamentals", "Neural Networks"],
    gradient:    "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.03))",
    border:      "#A78BFA",
    glow:        "rgba(167,139,250,0.3)",
  },
];

interface PrologueLine {
  text: string;
  sub:  string | null;
}

const PROLOGUE_LINES: PrologueLine[] = [
  { text: "Di suatu masa...",                      sub: null },
  { text: "Digital Realm sedang dalam bahaya.",    sub: null },
  { text: "💀 Logic Bug menyerang dari segala penjuru.", sub: "Sistem runtuh. Kode membusuk. Dunia digital menjerit." },
  { text: "Hanya satu harapan tersisa...",         sub: null },
  { text: "⚡ Seorang Pahlawan Kode.",             sub: "Seseorang yang mampu menguasai ilmu koding dan memulihkan keseimbangan." },
  { text: "🌟 Kamu dipilih.",                      sub: "Perjalananmu dimulai sekarang. Pilih jalanmu, kuasai kekuatanmu." },
];

function PrologueScreen({ onSkip, onFinish }: { onSkip: () => void; onFinish: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= PROLOGUE_LINES.length) {
      const t = setTimeout(onFinish, 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 2200);
    return () => clearTimeout(t);
  }, [step, onFinish]);

  const progress = Math.min((step / PROLOGUE_LINES.length) * 100, 100);
  const current  = PROLOGUE_LINES[Math.min(step, PROLOGUE_LINES.length - 1)];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#070F1A", fontFamily: "var(--font-geist-mono)" }}
    >
      <div className="absolute inset-0 overflow-hidden opacity-40">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse-glow"
            style={{
              left:       `${(i * 17) % 100}%`,
              top:        `${(i * 13) % 100}%`,
              width:      (i % 3) + 1,
              height:     (i % 3) + 1,
              background: "#F8FAFC",
              opacity:    0.2 + (i % 5) * 0.15,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl px-8">
        <div
          className="min-h-[120px] flex flex-col items-center justify-center"
          key={step}
          style={{ animation: "fade-up 0.6s ease both" }}
        >
          {step < PROLOGUE_LINES.length && (
            <>
              <p className="text-2xl font-bold text-ghost-white mb-4 leading-tight">
                {current.text}
              </p>
              {current.sub && (
                <p className="text-base text-text-secondary leading-relaxed">
                  {current.sub}
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-12 w-48 mx-auto">
          <div className="h-0.5 bg-deep-slate rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      `${progress}%`,
                background: "linear-gradient(90deg, #22D3EE, #A78BFA)",
                boxShadow:  "0 0 8px rgba(34,211,238,0.5)",
              }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onSkip}
        className="absolute bottom-8 right-8 text-xs text-text-muted hover:text-text-secondary transition-colors px-4 py-2 rounded-lg border border-deep-slate"
        style={{ background: "none" }}
      >
        Lewati →
      </button>

      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function HeroCard({
  hero,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  hero:     HeroClass;
  selected: boolean;
  hovered:  boolean;
  onSelect: () => void;
  onHover:  (v: boolean) => void;
}) {
  const active = selected || hovered;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="relative cursor-pointer rounded-2xl p-6 transition-all duration-300 flex flex-col h-full"
      style={{
        background:  active ? hero.gradient : "rgba(30,41,59,0.5)",
        border:      `2px solid ${active ? hero.border : "rgba(71,85,105,0.4)"}`,
        boxShadow:   active ? `0 0 32px ${hero.glow}` : "none",
        transform:   hovered && !selected ? "translateY(-4px)" : "none",
      }}
    >
      {selected && (
        <div
          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: hero.border, color: "#0F172A" }}
        >
          ✓
        </div>
      )}

      <div className="mb-5">
        <div className="text-4xl mb-3">{hero.icon}</div>
        <h3
          className="text-xl font-bold text-ghost-white mb-1"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {hero.name}
        </h3>
        <p className="text-xs font-semibold tracking-wider" style={{ color: hero.regionColor }}>
          {hero.tagline}
        </p>
      </div>

      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4 self-start"
        style={{
          background: `${hero.regionColor}20`,
          border:     `1px solid ${hero.regionColor}40`,
          color:      hero.regionColor,
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        📍 {hero.startRegion}
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-5 flex-1">
        {hero.desc}
      </p>

      <div className="mb-4">
        <p className="text-xs text-text-muted mb-2 tracking-wider" style={{ fontFamily: "var(--font-geist-mono)" }}>
          SKILL YANG DIPELAJARI
        </p>
        <div className="flex flex-wrap gap-1.5">
          {hero.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-1 rounded-md"
              style={{
                background: "rgba(15,23,42,0.6)",
                border:     "1px solid rgba(71,85,105,0.4)",
                color:      "#94A3B8",
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-text-muted mb-2 tracking-wider" style={{ fontFamily: "var(--font-geist-mono)" }}>
          QUEST PERTAMAMU
        </p>
        <div className="flex flex-col gap-1">
          {hero.quests.slice(0, 3).map((quest, i) => (
            <div key={quest} className="flex items-center gap-2 text-xs text-text-secondary">
              <span style={{ color: hero.regionColor }}>{i + 1}.</span>
              {quest}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  const [showPrologue, setShowPrologue] = useState(true);
  const [selected,     setSelected]     = useState<HeroClassId | null>(null);
  const [hovered,      setHovered]      = useState<HeroClassId | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleFinishPrologue = () => setShowPrologue(false);
  const handleSkipPrologue   = () => setShowPrologue(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profile/hero-class", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hero_class: selected }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Gagal menyimpan. Coba lagi.");
        return;
      }

      router.push("/adventure");
    } catch {
      setError("Koneksi gagal. Periksa internet kamu.");
    } finally {
      setLoading(false);
    }
  };

  const selectedHero = HERO_CLASSES.find((h) => h.id === selected);

  return (
    <>
      {showPrologue && (
        <PrologueScreen
          onSkip={handleSkipPrologue}
          onFinish={handleFinishPrologue}
        />
      )}

      <div
        className="min-h-screen relative"
        style={{ background: "#0F172A", color: "#F8FAFC" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
            <defs>
              <pattern id="hero-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
          <div
            className="absolute rounded-full"
            style={{
              top: "20%", left: "5%",
              width: 600, height: 600,
              background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              bottom: "10%", right: "5%",
              width: 500, height: 500,
              background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)",
            }}
          />
        </div>

        <div
          className="relative z-10 max-w-6xl mx-auto px-6 py-16 transition-all duration-700"
          style={{
            opacity:   mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(20px)",
          }}
        >
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-widest"
              style={{
                background:  "rgba(34,211,238,0.08)",
                border:      "1px solid rgba(34,211,238,0.2)",
                color:       "#22D3EE",
                fontFamily:  "var(--font-geist-mono)",
              }}
            >
              LANGKAH 1 DARI 1 · PILIH HERO CLASS
            </div>

            <h1
              className="text-4xl font-extrabold text-ghost-white mb-4"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Pilih Jalanmu,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #22D3EE, #A78BFA)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Pahlawan
              </span>
            </h1>
            <p className="text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
              Setiap hero memiliki jalur belajar yang unik. Kamu bisa eksplorasi semua
              region nantinya, tapi perjalananmu dimulai dari satu titik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {HERO_CLASSES.map((hero) => (
              <HeroCard
                key={hero.id}
                hero={hero}
                selected={selected === hero.id}
                hovered={hovered === hero.id}
                onSelect={() => setSelected(hero.id)}
                onHover={(v) => setHovered(v ? hero.id : null)}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-neon-rose"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border:     "1px solid rgba(248,113,113,0.25)",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!selected || loading}
              className="relative px-10 py-4 rounded-xl font-bold text-base tracking-wider transition-all duration-300"
              style={{
                fontFamily: "var(--font-geist-mono)",
                background: !selected
                  ? "#1E293B"
                  : loading
                  ? "#334155"
                  : selectedHero
                  ? `linear-gradient(135deg, ${selectedHero.border}, ${selectedHero.border}CC)`
                  : "linear-gradient(135deg, #22D3EE, #A78BFA)",
                color:      !selected ? "#475569" : "#0F172A",
                border:     "none",
                cursor:     !selected || loading ? "not-allowed" : "pointer",
                boxShadow:  selected && !loading && selectedHero
                  ? `0 0 24px ${selectedHero.glow}`
                  : "none",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  Menyimpan pilihan...
                </span>
              ) : selected && selectedHero ? (
                `Mulai sebagai ${selectedHero.name} →`
              ) : (
                "Pilih Hero Class dahulu"
              )}
            </button>

            {selected && selectedHero && (
              <p className="text-xs text-text-muted text-center">
                Kamu akan memulai di{" "}
                <span style={{ color: selectedHero.regionColor }}>
                  {selectedHero.startRegion}
                </span>
                . Region lain bisa dikunjungi setelah Level 5.
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}