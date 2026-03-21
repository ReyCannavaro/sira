"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Lightbulb, Play, RotateCcw, CheckCircle, XCircle,
  AlertCircle, Zap, Flame, Loader2, ChevronRight, BookOpen,
  Terminal, Eye, Maximize2, Minimize2, ArrowRight
} from "lucide-react";

interface Quest {
  id: string; slug: string; title: string;
  story_intro: string | null; instructions: string;
  language: "javascript" | "python";
  starter_code: string | null; expected_output: string;
  test_cases: { input: string; expected_output: string }[];
  hints: { level: number; text: string }[];
  difficulty: string; exp_reward: number; order_index: number;
  prerequisite_quest_id: string | null;
}
interface Region    { slug: string; name: string; color: string; }
interface NextQuest { slug: string; title: string; difficulty: string; exp_reward: number; }
interface LastAttempt { submitted_code: string; status: string; exp_earned: number; socratic_feedback: string | null; }
type FeedbackStatus = "syntax_error" | "logic_error" | "passed_dirty" | "passed_clean" | null;

const DIFF_LABEL: Record<string, string> = { easy: "Mudah", normal: "Normal", hard: "Sulit", expert: "Expert" };
const DIFF_COLOR: Record<string, string> = { easy: "#34D399", normal: "#22D3EE", hard: "#A78BFA", expert: "#F59E0B" };

function isHTMLCode(src: string) {
  const t = src.trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.startsWith("<head") || t.startsWith("<body");
}

function CodeEditor({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const taRef  = useRef<HTMLTextAreaElement>(null);
  const lnRef  = useRef<HTMLDivElement>(null);
  const lines  = value.split("\n").length;

  const syncScroll = useCallback(() => {
    if (taRef.current && lnRef.current)
      lnRef.current.scrollTop = taRef.current.scrollTop;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s  = ta.selectionStart;
      const nv = value.slice(0, s) + "  " + value.slice(ta.selectionEnd);
      onChange(nv);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "#060C18", minHeight: 0 }}>
      <div ref={lnRef} style={{
        width: 46, flexShrink: 0, overflowY: "hidden",
        background: "#070D1A", borderRight: "1px solid #0F1C2E",
        paddingTop: 16, userSelect: "none",
      }}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{
            fontSize: 11, lineHeight: "1.7em", paddingRight: 12,
            textAlign: "right", color: "#1E2D42",
            fontFamily: "var(--font-jetbrains-mono)",
          }}>
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        disabled={disabled}
        spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{
          flex: 1, resize: "none", border: "none", outline: "none",
          background: "transparent", color: "#E2E8F0",
          fontFamily: "var(--font-jetbrains-mono)", fontSize: 13,
          lineHeight: "1.7em", padding: "16px 18px", overflowY: "auto",
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}

function LivePreview({ code }: { code: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ borderTop: "1px solid #0F1C2E" }}>
      <button onClick={() => setShow(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 6, width: "100%",
        padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
        color: "#334155", fontSize: 11, fontFamily: "var(--font-geist-mono)",
      }}>
        {show ? <Minimize2 size={11} /> : <Eye size={11} />}
        {show ? "Sembunyikan Preview" : "Lihat Preview"}
      </button>
      {show && (
        <iframe
          srcDoc={code}
          sandbox="allow-scripts"
          style={{ width: "100%", height: 220, border: "none", background: "#fff", display: "block" }}
          title="preview"
        />
      )}
    </div>
  );
}

function FeedbackPanel({ status, text, expEarned, isRetry }: {
  status: FeedbackStatus; text: string; expEarned?: number; isRetry: boolean;
}) {
  if (!status || !text) return null;

  const cfg = {
    syntax_error:  { color: "#F87171", label: "Syntax Error",       Icon: XCircle      },
    logic_error:   { color: "#FBBF24", label: "Logika Belum Tepat", Icon: AlertCircle  },
    passed_dirty:  { color: "#F59E0B", label: "Hampir Sempurna!",   Icon: AlertCircle  },
    passed_clean:  { color: "#34D399", label: "Quest Selesai!",     Icon: CheckCircle  },
  }[status];
  if (!cfg) return null;
  const { Icon } = cfg;

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${cfg.color}33`, animation: "slide-up .3s ease" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}55)` }} />
      <div style={{ padding: "14px 16px", background: `${cfg.color}08` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon size={14} color={cfg.color} strokeWidth={2} />
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: cfg.color }}>
            {cfg.label}
          </span>
          {(status === "passed_clean" || status === "passed_dirty") && expEarned !== undefined && (
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700, color: "#34D399" }}>
              {expEarned > 0 ? `+${expEarned} EXP` : isRetry ? "Clean Code Bonus!" : ""}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7, fontFamily: "var(--font-jetbrains-mono)" }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function InstructionSteps({ text }: { text: string }) {
  const steps = text.split(/\n+/).filter(l => l.trim());
  if (steps.length <= 1) {
    return (
      <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
        {text}
      </p>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            background: "#0F1C2E", border: "1px solid #1E2D42",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: "#334155",
            marginTop: 1,
          }}>
            {i + 1}
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, flex: 1 }}>
            {step.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "")}
          </p>
        </div>
      ))}
    </div>
  );
}

function ExpPopup({ data }: { data: { exp: number; streak: number; leveledUp: boolean; newLevel: number } }) {
  return (
    <div style={{
      position: "fixed", top: 72, right: 24, zIndex: 100,
      display: "flex", flexDirection: "column", gap: 10,
      animation: "exp-slide-in .4s cubic-bezier(.16,1,.3,1)",
      pointerEvents: "none",
    }}>
      {data.leveledUp && (
        <div style={{
          padding: "14px 22px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.12))",
          border: "1px solid rgba(34,211,238,0.4)",
          textAlign: "center",
        }}>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#22D3EE", letterSpacing: "0.12em", marginBottom: 4 }}>LEVEL UP!</p>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 28, fontWeight: 800, color: "#F1F5F9", lineHeight: 1 }}>Level {data.newLevel}</p>
        </div>
      )}
      <div style={{
        padding: "12px 18px", borderRadius: 12,
        background: "rgba(8,14,26,0.97)", border: "1px solid #1A2535",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(52,211,153,0.15)", border: "1.5px solid #34D399",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={16} color="#34D399" strokeWidth={1.75} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: "#475569", marginBottom: 1 }}>EXP DIPEROLEH</p>
            <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 22, fontWeight: 800, color: "#34D399", lineHeight: 1 }}>+{data.exp}</p>
          </div>
        </div>
        {data.streak > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 6, borderTop: "1px solid #1A2535" }}>
            <Flame size={14} color="#F59E0B" strokeWidth={1.75} />
            <span style={{ fontSize: 11, color: "#F59E0B", fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
              {data.streak} hari berturut-turut!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestEditorClient({ quest, region, lastAttempt, isFirstPass, userId, nextQuest }: {
  quest: Quest; region: Region; lastAttempt: LastAttempt | null;
  isFirstPass: boolean; userId: string; nextQuest: NextQuest | null;
}) {
  const router = useRouter();

  const initCode = lastAttempt?.submitted_code ?? quest.starter_code ?? "";
  const [code,        setCode]        = useState(initCode);
  const [feedback,    setFeedback]    = useState<{ status: FeedbackStatus; text: string; exp: number } | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [hintsUsed,   setHintsUsed]   = useState(0);
  const [hintVisible, setHintVisible] = useState<string | null>(null);
  const [startTime]                   = useState(Date.now());
  const [output,      setOutput]      = useState<string | null>(null);
  const [expPopup,    setExpPopup]    = useState<{ exp: number; streak: number; leveledUp: boolean; newLevel: number } | null>(null);
  const [pyReady,     setPyReady]     = useState(false);
  const [activePanel, setActivePanel] = useState<"instructions" | "output">("instructions");
  const workerRef  = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, (r: { output: string; error: string | null; stderr: string }) => void>>(new Map());

  const isRetry     = !isFirstPass;
  const hintsLeft   = quest.hints.length - hintsUsed;
  const regionColor = region.color || "#22D3EE";
  const passed      = feedback?.status === "passed_clean" || feedback?.status === "passed_dirty";
  const isHTML      = isHTMLCode(code);

  useEffect(() => {
    if (quest.language !== "python") return;
    const worker = new Worker("/pyodide-worker.js");
    worker.onmessage = (e) => {
      const { id, output: out, error, stderr } = e.data;
      if (id === "__ready__") { setPyReady(true); return; }
      const resolve = pendingRef.current.get(id);
      if (resolve) { resolve({ output: out ?? "", error, stderr: stderr ?? "" }); pendingRef.current.delete(id); }
    };
    setTimeout(() => worker.postMessage({ id: "__ready__", code: 'print("ok")', packages: [] }), 200);
    workerRef.current = worker;
    return () => worker.terminate();
  }, [quest.language]);

  const runPythonCode = (src: string): Promise<{ output: string; error: string | null; stderr: string }> =>
    new Promise(resolve => {
      const id = Math.random().toString(36).slice(2);
      pendingRef.current.set(id, resolve);
      workerRef.current?.postMessage({ id, code: src, packages: [] });
    });

  const runJavaScript = (src: string): { output: string; hadSyntaxError: boolean } => {
    const logs: string[] = [];
    const fc = {
      log:   (...a: unknown[]) => logs.push(a.map(String).join(" ")),
      error: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
      warn:  (...a: unknown[]) => logs.push(a.map(String).join(" ")),
    };
    try {
      new Function("console", src)(fc);
      return { output: logs.join("\n"), hadSyntaxError: false };
    } catch (e: unknown) {
      return { output: e instanceof Error ? e.message : String(e), hadSyntaxError: true };
    }
  };

  const handleSubmit = async () => {
    if (submitting || !code.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    setOutput(null);

    const durationSec = Math.round((Date.now() - startTime) / 1000);
    let actualOutput   = "";
    let hadSyntaxError = false;

    if (isHTML) {
      actualOutput = code; hadSyntaxError = false; setOutput(null);
    } else if (quest.language === "javascript") {
      const r = runJavaScript(code);
      actualOutput = r.output; hadSyntaxError = r.hadSyntaxError;
      setOutput(actualOutput || null); setActivePanel("output");
    } else if (quest.language === "python") {
      if (!workerRef.current) {
        setFeedback({ status: "syntax_error", text: "Python runtime belum siap. Tunggu sebentar.", exp: 0 });
        setSubmitting(false); return;
      }
      const pyResult  = await runPythonCode(code);
      actualOutput    = pyResult.output.trim();
      hadSyntaxError  = !!pyResult.error;
      if (hadSyntaxError) actualOutput = pyResult.error ?? pyResult.stderr ?? "";
      setOutput(actualOutput || null); setActivePanel("output");
    }

    try {
      const res  = await fetch("/api/quests/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quest_id: quest.id, submitted_code: code,
          hints_used_count: hintsUsed, duration_sec: durationSec,
          language: quest.language, expected_output: quest.expected_output,
          actual_output: actualOutput, had_syntax_error: hadSyntaxError,
          test_cases: quest.test_cases,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ status: "syntax_error", text: data.error ?? "Terjadi kesalahan.", exp: 0 });
        return;
      }
      const d = data.data;
      setFeedback({ status: d?.status as FeedbackStatus, text: d?.socratic_feedback ?? "", exp: d?.exp_earned ?? 0 });

      const isPassed = d?.status === "passed_clean" || d?.status === "passed_dirty";
      if (isPassed && (d?.exp_earned ?? 0) > 0) {
        setExpPopup({ exp: d.exp_earned, streak: d.current_streak ?? 0, leveledUp: d.leveled_up ?? false, newLevel: d.new_level ?? 1 });
        setTimeout(() => setExpPopup(null), 4000);
      }
      if (isPassed) setTimeout(() => router.refresh(), 2000);
    } catch (e) {
      setFeedback({ status: "syntax_error", text: "Koneksi gagal. Coba lagi.", exp: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHint = () => {
    const hint = quest.hints[hintsUsed];
    if (!hint) return;
    setHintVisible(hint.text);
    setHintsUsed(n => n + 1);
    setActivePanel("instructions");
  };

  const handleReset = () => {
    setCode(quest.starter_code ?? "");
    setFeedback(null);
    setOutput(null);
  };

  return (
    <div style={{ height: "100vh", background: "#080F1C", color: "#F8FAFC", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {expPopup && <ExpPopup data={expPopup} />}

      <div style={{
        height: 50, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", background: "#070D1A",
        borderBottom: `1px solid ${regionColor}22`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/adventure")} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "1px solid #1A2535", borderRadius: 7,
            padding: "4px 10px", color: "#475569", cursor: "pointer", fontSize: 12,
            transition: "all .2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1A2535"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}
          >
            <ArrowLeft size={12} strokeWidth={2} /> Peta
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11, color: "#263348" }}>{region.name}</span>
            <ChevronRight size={11} color="#263348" />
            <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)", fontWeight: 600, color: "#64748B" }}>
              #{quest.order_index} {quest.title}
            </span>
          </div>

          {isRetry && (
            <span style={{ padding: "1px 7px", borderRadius: 5, background: "#F59E0B14", border: "1px solid #F59E0B33", fontSize: 9, color: "#F59E0B", fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
              RETRY
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            padding: "2px 8px", borderRadius: 99,
            border: `1px solid ${DIFF_COLOR[quest.difficulty] ?? "#94A3B8"}44`,
            background: `${DIFF_COLOR[quest.difficulty] ?? "#94A3B8"}12`,
            color: DIFF_COLOR[quest.difficulty] ?? "#94A3B8",
            fontSize: 10, fontFamily: "var(--font-geist-mono)", fontWeight: 700,
          }}>
            {DIFF_LABEL[quest.difficulty] ?? quest.difficulty}
          </span>
          <span style={{ padding: "2px 8px", borderRadius: 99, border: `1px solid ${regionColor}44`, background: `${regionColor}12`, color: regionColor, fontSize: 10, fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
            {isRetry ? "+0 / +25" : `+${quest.exp_reward}`} EXP
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 99, border: "1px solid #1A2535", background: "#0B1524", fontSize: 10, fontFamily: "var(--font-geist-mono)", color: "#475569" }}>
            {quest.language === "python" ? (
              <>
                Python
                {!pyReady
                  ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
                  : <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
                }
              </>
            ) : quest.language === "javascript" ? "JavaScript" : "HTML"}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        <div style={{
          width: 340, flexShrink: 0, display: "flex", flexDirection: "column",
          background: "#070D1A", borderRight: "1px solid #0F1C2E",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid #0F1C2E", flexShrink: 0 }}>
            {[
              { id: "instructions", label: "Instruksi", Icon: BookOpen },
              { id: "output",       label: "Output",    Icon: Terminal  },
            ].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActivePanel(id as typeof activePanel)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 0", border: "none", cursor: "pointer",
                background: activePanel === id ? "#080F1C" : "transparent",
                color: activePanel === id ? regionColor : "#334155",
                borderBottom: `2px solid ${activePanel === id ? regionColor : "transparent"}`,
                fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.08em", transition: "all .15s",
              }}>
                <Icon size={11} strokeWidth={activePanel === id ? 2 : 1.75} />
                {label.toUpperCase()}
                {id === "output" && output !== null && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: regionColor, display: "inline-block" }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 24px" }}>

            {activePanel === "instructions" && (
              <>
                {quest.story_intro && (
                  <div style={{
                    marginBottom: 20, padding: "12px 14px", borderRadius: 10,
                    background: `${regionColor}08`, border: `1px solid ${regionColor}1a`,
                    borderLeft: `3px solid ${regionColor}`,
                  }}>
                    <p style={{ fontSize: 12, color: `${regionColor}cc`, lineHeight: 1.7, fontStyle: "italic" }}>
                      {quest.story_intro}
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, color: "#263348", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 12 }}>
                    INSTRUKSI
                  </p>
                  <InstructionSteps text={quest.instructions} />
                </div>

                {quest.expected_output && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 10, color: "#263348", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10 }}>
                      OUTPUT YANG DIHARAPKAN
                    </p>
                    <pre style={{
                      background: "#040A14", border: "1px solid #0F1C2E", borderRadius: 8,
                      padding: "12px 14px", fontSize: 12,
                      color: "#34D399", fontFamily: "var(--font-jetbrains-mono)",
                      overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
                    }}>
                      {quest.expected_output}
                    </pre>
                  </div>
                )}

                <div style={{ padding: "12px 14px", borderRadius: 10, background: "#040A14", border: "1px solid #0F1C2E", marginBottom: 16 }}>
                  {isRetry ? (
                    <p style={{ fontSize: 11, color: "#334155", lineHeight: 1.65 }}>
                      Kamu sudah pernah menyelesaikan quest ini.<br />
                      <span style={{ color: "#34D399" }}>Bonus +25 EXP</span> tetap tersedia jika Clean Code ≥ 80.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { label: "Tanpa hint", value: `+${quest.exp_reward * 2} EXP`, color: "#34D399" },
                        { label: "Dengan hint", value: `+${quest.exp_reward} EXP`,   color: "#94A3B8" },
                        { label: "Clean Code ≥80", value: "+25 bonus",               color: "#22D3EE" },
                      ].map(row => (
                        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#334155" }}>{row.label}</span>
                          <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: row.color }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {hintVisible && (
                  <div style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: "#FBBF2406", border: "1px solid #FBBF2422",
                    borderLeft: "3px solid #FBBF24",
                    animation: "slide-up .25s ease",
                  }}>
                    <p style={{ fontSize: 10, color: "#FBBF24", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", marginBottom: 6 }}>PETUNJUK</p>
                    <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.65, fontFamily: "var(--font-jetbrains-mono)" }}>
                      {hintVisible}
                    </p>
                  </div>
                )}
              </>
            )}

            {activePanel === "output" && (
              <>
                {output !== null ? (
                  <div>
                    <p style={{ fontSize: 10, color: "#263348", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10 }}>
                      OUTPUT
                    </p>
                    <pre style={{
                      background: "#040A14", border: "1px solid #0F1C2E", borderRadius: 8,
                      padding: "12px 14px", fontSize: 12, color: "#94A3B8",
                      fontFamily: "var(--font-jetbrains-mono)",
                      whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
                      minHeight: 80,
                    }}>
                      {output || "(kosong)"}
                    </pre>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 180, gap: 10 }}>
                    <Terminal size={28} color="#1A2535" strokeWidth={1} />
                    <p style={{ fontSize: 12, color: "#1E2D42", textAlign: "center" }}>
                      Jalankan kode untuk melihat output
                    </p>
                  </div>
                )}

                {feedback && (
                  <div style={{ marginTop: 16 }}>
                    <FeedbackPanel status={feedback.status} text={feedback.text} expEarned={feedback.exp} isRetry={isRetry} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            <CodeEditor value={code} onChange={setCode} disabled={submitting} />

            {isHTML && <LivePreview code={code} />}
          </div>

          <div style={{
            flexShrink: 0, background: "#070D1A",
            borderTop: "1px solid #0F1C2E",
            padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>

            {passed && nextQuest && (
              <div style={{
                borderRadius: 10, overflow: "hidden",
                border: `1px solid ${regionColor}33`,
                animation: "slide-up .35s ease",
              }}>
                <div style={{ height: 2, background: `linear-gradient(90deg, ${regionColor}, ${regionColor}44)` }} />
                <div style={{
                  padding: "12px 14px",
                  background: `${regionColor}08`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 9, color: `${regionColor}77`, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", marginBottom: 3 }}>
                      QUEST #{quest.order_index + 1} BERIKUTNYA
                    </p>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700, color: "#F1F5F9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nextQuest.title}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: DIFF_COLOR[nextQuest.difficulty] ?? "#94A3B8", fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
                        {DIFF_LABEL[nextQuest.difficulty] ?? nextQuest.difficulty}
                      </span>
                      <span style={{ fontSize: 10, color: "#34D399", fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
                        +{nextQuest.exp_reward} EXP
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/adventure/${region.slug}/${nextQuest.slug}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "8px 18px", borderRadius: 8, border: "none",
                      background: regionColor, color: "#080E1A",
                      fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", flexShrink: 0,
                      boxShadow: `0 4px 16px ${regionColor}44`,
                      transition: "all .2s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${regionColor}66`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${regionColor}44`; }}
                  >
                    Lanjut <ArrowRight size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={handleReset} title="Reset kode" style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #1A2535", background: "none",
                color: "#334155", cursor: "pointer", transition: "all .2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; (e.currentTarget as HTMLElement).style.color = "#64748B"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1A2535"; (e.currentTarget as HTMLElement).style.color = "#334155"; }}
              >
                <RotateCcw size={13} strokeWidth={2} />
              </button>

              <button onClick={handleHint} disabled={hintsLeft === 0} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "0 14px", height: 36, borderRadius: 8, flexShrink: 0,
                border: `1px solid ${hintsLeft > 0 ? "#FBBF2433" : "#1A2535"}`,
                background: "none", color: hintsLeft > 0 ? "#FBBF24" : "#263348",
                cursor: hintsLeft > 0 ? "pointer" : "not-allowed",
                fontSize: 12, transition: "all .2s",
              }}
                onMouseEnter={e => { if (hintsLeft > 0) (e.currentTarget as HTMLElement).style.background = "#FBBF2410"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                <Lightbulb size={13} strokeWidth={1.75} />
                Hint ({hintsLeft})
              </button>

              <button onClick={handleSubmit} disabled={submitting || !code.trim()} style={{
                flex: 1, height: 36, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                border: "none", cursor: submitting || !code.trim() ? "not-allowed" : "pointer",
                background: submitting || !code.trim() ? "#1A2535" : passed ? "#34D399" : regionColor,
                color: submitting || !code.trim() ? "#334155" : "#080E1A",
                fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700,
                boxShadow: !submitting && !passed && code.trim() ? `0 0 20px ${regionColor}33` : "none",
                transition: "all .2s", opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? (
                  <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #33415533", borderTopColor: "#64748B", animation: "spin 1s linear infinite" }} /> Memvalidasi...</>
                ) : passed ? (
                  <><CheckCircle size={14} strokeWidth={2} /> Selesai!</>
                ) : (
                  <><Play size={13} strokeWidth={2.5} fill="currentColor" /> Submit Quest</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin        { from { transform: rotate(0deg);   } to { transform: rotate(360deg); } }
        @keyframes slide-up    { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0); } }
        @keyframes exp-slide-in{ from { opacity: 0; transform: translateX(24px) scale(.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
      `}</style>
    </div>
  );
}