"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb, Play, RotateCcw, CheckCircle, XCircle, AlertCircle, Zap, Flame } from "lucide-react";

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
interface Region { slug: string; name: string; color: string; }
interface NextQuest { slug: string; title: string; difficulty: string; exp_reward: number; }
interface LastAttempt {
  submitted_code: string; status: string;
  exp_earned: number; socratic_feedback: string | null;
}

type FeedbackStatus = "syntax_error" | "logic_error" | "passed_dirty" | "passed_clean" | null;

const DIFF_LABEL: Record<string, string> = { easy: "Mudah", normal: "Normal", hard: "Sulit", expert: "Expert" };
const DIFF_COLOR: Record<string, string> = { easy: "#34D399", normal: "#22D3EE", hard: "#A78BFA", expert: "#F59E0B" };

function NeonBadge({ children, color = "#22D3EE" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "1px 8px", borderRadius: 999,
      border: `1px solid ${color}44`, background: `${color}18`,
      color, fontSize: 10, fontFamily: "var(--font-geist-mono)", fontWeight: 700,
    }}>
      {children}
    </span>
  );
}

function CodeEditor({ value, onChange, language, disabled }: {
  value: string; onChange: (v: string) => void;
  language: string; disabled?: boolean;
}) {
  const taRef   = useRef<HTMLTextAreaElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback(() => {
    if (taRef.current && lineRef.current) {
      lineRef.current.scrollTop = taRef.current.scrollTop;
    }
  }, []);

  const lines = value.split("\n").length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta    = e.currentTarget;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newVal = value.slice(0, start) + "  " + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div style={{
      flex: 1, display: "flex", minHeight: 0, overflow: "hidden",
      background: "#070D1A", borderRadius: 10,
      border: "1px solid #1A2535", fontFamily: "var(--font-jetbrains-mono)",
    }}>
      <div ref={lineRef} style={{
        width: 44, flexShrink: 0, overflowY: "hidden",
        background: "#080F1C", borderRight: "1px solid #1A2535",
        padding: "14px 0", userSelect: "none",
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0,
      }}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{
            fontSize: 12, lineHeight: "1.65em", paddingRight: 10,
            color: "#263348", fontFamily: "var(--font-jetbrains-mono)",
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
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          flex: 1, resize: "none", border: "none", outline: "none",
          background: "transparent", color: "#E2E8F0",
          fontFamily: "var(--font-jetbrains-mono)", fontSize: 13,
          lineHeight: "1.65em", padding: "14px 16px",
          overflowY: "auto",
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
}

function FeedbackPanel({ status, text, expEarned, isRetry }: {
  status: FeedbackStatus; text: string; expEarned?: number; isRetry: boolean;
}) {
  if (!status || !text) return null;

  const cfg = {
    syntax_error:  { color: "#F87171", label: "Syntax Error",      Icon: XCircle      },
    logic_error:   { color: "#FBBF24", label: "Logika Belum Tepat", Icon: AlertCircle  },
    passed_dirty:  { color: "#F59E0B", label: "Hampir Sempurna",    Icon: AlertCircle  },
    passed_clean:  { color: "#34D399", label: "Quest Selesai!",     Icon: CheckCircle  },
  }[status];

  if (!cfg) return null;

  const StatusIcon = cfg.Icon;

  return (
    <div style={{
      borderRadius: 10, overflow: "hidden",
      border: `1px solid ${cfg.color}33`,
      animation: "feedback-up .25s ease",
    }}>
      <div style={{ height: 2, background: cfg.color }} />
      <div style={{ padding: "12px 16px", background: `${cfg.color}08` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <StatusIcon size={14} color={cfg.color} strokeWidth={2} />
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: cfg.color }}>
            {cfg.label}
          </span>
          {status === "passed_clean" && expEarned !== undefined && (
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700, color: "#34D399" }}>
              {isRetry ? (expEarned > 0 ? `+${expEarned} EXP` : "Clean Code Bonus!") : `+${expEarned} EXP`}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.65, fontFamily: "var(--font-jetbrains-mono)" }}>
          {text}
        </p>
      </div>
    </div>
  );
}

export default function QuestEditorClient({ quest, region, lastAttempt, isFirstPass, userId, nextQuest }: {
  quest: Quest; region: Region; lastAttempt: LastAttempt | null;
  isFirstPass: boolean; userId: string;
  nextQuest: NextQuest | null;
}) {
  const router = useRouter();

  const initCode = lastAttempt?.submitted_code ?? quest.starter_code ?? "";
  const [code,         setCode]         = useState(initCode);
  const [feedback,     setFeedback]     = useState<{ status: FeedbackStatus; text: string; exp: number } | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [hintsUsed,    setHintsUsed]    = useState(0);
  const [hintVisible,  setHintVisible]  = useState<string | null>(null);
  const [startTime]                     = useState(Date.now());
  const [output,       setOutput]       = useState<string | null>(null);
  const [expPopup,     setExpPopup]     = useState<{ exp: number; streak: number; leveledUp: boolean; newLevel: number } | null>(null);
  const isRetry = !isFirstPass;

  const isHTMLCode = (src: string) => {
    const trimmed = src.trim().toLowerCase();
    return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<head") || trimmed.startsWith("<body");
  };

  const normalizeHTML = (src: string) =>
    src.trim().replace(/\s+/g, " ").replace(/> </g, "><").replace(/\n/g, "").replace(/  +/g, " ");

  const runJavaScript = (src: string): { output: string; hadSyntaxError: boolean } => {
    const logs: string[] = [];
    const fakeConsole = {
      log:   (...a: unknown[]) => logs.push(a.map(String).join(" ")),
      error: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
      warn:  (...a: unknown[]) => logs.push(a.map(String).join(" ")),
    };
    try {
      const fn = new Function("console", src);
      fn(fakeConsole);
      return { output: logs.join("\n"), hadSyntaxError: false };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: msg, hadSyntaxError: true };
    }
  };

  const handleSubmit = async () => {
    if (submitting || !code.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    setOutput(null);

    const durationSec = Math.round((Date.now() - startTime) / 1000);

    let actualOutput    = "";
    let hadSyntaxError  = false;

    if (isHTMLCode(code)) {
      actualOutput   = code;
      hadSyntaxError = false;
      setOutput(null);
    } else if (quest.language === "javascript") {
      const result   = runJavaScript(code);
      actualOutput   = result.output;
      hadSyntaxError = result.hadSyntaxError;
      setOutput(actualOutput || null);
    }

    try {
      const res  = await fetch("/api/quests/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          quest_id:         quest.id,
          submitted_code:   code,
          hints_used_count: hintsUsed,
          duration_sec:     durationSec,
          language:         quest.language,
          expected_output:  quest.expected_output,
          actual_output:    actualOutput,
          had_syntax_error: hadSyntaxError,
          test_cases:       quest.test_cases,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ status: "syntax_error", text: data.error ?? "Terjadi kesalahan.", exp: 0 });
        return;
      }

      const d = data.data;
      setFeedback({
        status: d?.status as FeedbackStatus,
        text:   d?.socratic_feedback ?? "",
        exp:    d?.exp_earned ?? 0,
      });

      const passed = d?.status === "passed_clean" || d?.status === "passed_dirty";
      if (passed && (d?.exp_earned ?? 0) > 0) {
        setExpPopup({
          exp:       d?.exp_earned ?? 0,
          streak:    d?.current_streak ?? 0,
          leveledUp: d?.leveled_up ?? false,
          newLevel:  d?.new_level ?? 1,
        });
        setTimeout(() => setExpPopup(null), 4000);
      }

      if (passed) {
        setTimeout(() => router.refresh(), 2000);
      }
    } catch (e) {
      console.error("submit error:", e);
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
  };

  const hintsLeft = quest.hints.length - hintsUsed;
  const regionColor = region.color || "#22D3EE";
  const passed = feedback?.status === "passed_clean" || feedback?.status === "passed_dirty";

  return (
    <div style={{ minHeight: "100vh", background: "#0A1220", color: "#F8FAFC", display: "flex", flexDirection: "column" }}>

      {expPopup && (
        <div style={{
          position: "fixed", top: 72, right: 24, zIndex: 100,
          display: "flex", flexDirection: "column", gap: 10,
          animation: "exp-slide-in .35s cubic-bezier(.16,1,.3,1)",
          pointerEvents: "none",
        }}>
          {expPopup.leveledUp && (
            <div style={{
              padding: "14px 22px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.12))",
              border: "1px solid rgba(34,211,238,0.4)",
              boxShadow: "0 8px 32px rgba(34,211,238,0.2)",
              textAlign: "center",
            }}>
              <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#22D3EE", letterSpacing: "0.12em", marginBottom: 4 }}>
                LEVEL UP!
              </p>
              <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 28, fontWeight: 800, color: "#F1F5F9", lineHeight: 1 }}>
                Level {expPopup.newLevel}
              </p>
            </div>
          )}

          <div style={{
            padding: "12px 18px", borderRadius: 12,
            background: "rgba(8,14,26,0.95)",
            border: "1px solid #1A2535",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "rgba(52,211,153,0.15)", border: "1.5px solid #34D399",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={16} color="#34D399" strokeWidth={1.75} />
              </div>
              <div>
                <p style={{ fontSize: 10, color: "#475569", marginBottom: 1 }}>EXP DIPEROLEH</p>
                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 22, fontWeight: 800, color: "#34D399", lineHeight: 1 }}>
                  +{expPopup.exp}
                </p>
              </div>
            </div>
            {expPopup.streak > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 6, borderTop: "1px solid #1A2535" }}>
                <Flame size={14} color="#F59E0B" strokeWidth={1.75} />
                <div>
                  <span style={{ fontSize: 11, color: "#F59E0B", fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
                    {expPopup.streak} hari berturut-turut!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        height: 52, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(8,14,26,0.9)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #1A2535",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/adventure")} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "1px solid #1A2535", borderRadius: 7,
            padding: "5px 10px", color: "#475569", cursor: "pointer", fontSize: 12,
            transition: "all .2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1A2535"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Peta
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#334155" }}>{region.name}</span>
            <span style={{ fontSize: 11, color: "#263348" }}>/</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: "#94A3B8" }}>
              {quest.title}
            </span>
          </div>

          {isRetry && (
            <span style={{
              padding: "2px 8px", borderRadius: 6,
              background: "#F59E0B18", border: "1px solid #F59E0B33",
              fontSize: 10, color: "#F59E0B", fontFamily: "var(--font-geist-mono)", fontWeight: 700,
            }}>
              RETRY
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NeonBadge color={DIFF_COLOR[quest.difficulty] ?? "#94A3B8"}>
            {DIFF_LABEL[quest.difficulty] ?? quest.difficulty}
          </NeonBadge>
          <NeonBadge color={regionColor}>
            {isRetry ? "+0 / +25 EXP" : `+${quest.exp_reward} EXP`}
          </NeonBadge>
          <span style={{ width: 1, height: 14, background: "#1A2535", display: "inline-block" }} />
          <NeonBadge color="#475569">
            {quest.language === "javascript" ? "JavaScript" : "Python"}
          </NeonBadge>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

        <div style={{
          width: 380, flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: "1px solid #1A2535", overflowY: "auto",
          background: "#090F1D",
        }}>
          {quest.story_intro && (
            <div style={{
              margin: "16px 16px 0", padding: "12px 14px", borderRadius: 10,
              background: `${regionColor}0c`, border: `1px solid ${regionColor}22`,
            }}>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7, fontStyle: "italic" }}>
                {quest.story_intro}
              </p>
            </div>
          )}

          <div style={{ padding: "16px 16px 0" }}>
            <p style={{ fontSize: 10, color: "#334155", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", marginBottom: 10 }}>
              INSTRUKSI
            </p>
            <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
              {quest.instructions}
            </div>
          </div>

          {quest.expected_output && (
            <div style={{ padding: "16px 16px 0" }}>
              <p style={{ fontSize: 10, color: "#334155", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", marginBottom: 8 }}>
                OUTPUT YANG DIHARAPKAN
              </p>
              <pre style={{
                background: "#070D1A", border: "1px solid #1A2535", borderRadius: 8,
                padding: "10px 12px", fontSize: 12, color: "#34D399",
                fontFamily: "var(--font-jetbrains-mono)", overflowX: "auto",
                whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {quest.expected_output}
              </pre>
            </div>
          )}

          <div style={{ padding: "14px 16px 0" }}>
            <div style={{ padding: "10px 12px", borderRadius: 9, background: "#0B1524", border: "1px solid #1A2535" }}>
              {isRetry ? (
                <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>
                  Kamu sudah pernah menyelesaikan quest ini. Base EXP tidak diberikan lagi.<br />
                  <span style={{ color: "#34D399" }}>Bonus +25 EXP</span> tetap tersedia jika Clean Code Score ≥ 80.
                </p>
              ) : (
                <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>
                  <span style={{ color: "#34D399" }}>+{quest.exp_reward * 2} EXP</span> jika selesai tanpa hint ·{" "}
                  <span style={{ color: "#94A3B8" }}>+{quest.exp_reward} EXP</span> dengan hint ·{" "}
                  <span style={{ color: "#22D3EE" }}>+25 bonus</span> Clean Code ≥ 80
                </p>
              )}
            </div>
          </div>

          {hintVisible && (
            <div style={{ padding: "14px 16px 0" }}>
              <div style={{
                padding: "11px 13px", borderRadius: 9,
                background: "#FBBF2408", border: "1px solid #FBBF2433",
                animation: "feedback-up .2s ease",
              }}>
                <p style={{ fontSize: 10, color: "#FBBF24", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.08em", marginBottom: 6 }}>
                  PETUNJUK
                </p>
                <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.65, fontFamily: "var(--font-jetbrains-mono)" }}>
                  {hintVisible}
                </p>
              </div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: 20 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          <div style={{ flex: 1, minHeight: 0, padding: "12px 12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={quest.language}
              disabled={submitting}
            />
          </div>

          <div style={{ padding: "10px 12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>

            {output !== null && (
              <div style={{
                padding: "10px 12px", borderRadius: 9,
                background: "#070D1A", border: "1px solid #1A2535",
              }}>
                <p style={{ fontSize: 10, color: "#334155", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", marginBottom: 6 }}>
                  OUTPUT
                </p>
                <pre style={{ fontSize: 12, color: "#94A3B8", fontFamily: "var(--font-jetbrains-mono)", margin: 0, whiteSpace: "pre-wrap" }}>
                  {output || "(kosong)"}
                </pre>
              </div>
            )}

            {feedback && (
              <FeedbackPanel
                status={feedback.status}
                text={feedback.text}
                expEarned={feedback.exp}
                isRetry={isRetry}
              />
            )}

            {passed && nextQuest ? (
              <div style={{
                borderRadius: 12, overflow: "hidden",
                border: `1px solid ${regionColor}33`,
                animation: "feedback-up .3s ease",
              }}>
                <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${regionColor}, transparent)` }} />

                <div style={{
                  padding: "14px 16px",
                  background: `linear-gradient(135deg, ${regionColor}10 0%, ${regionColor}06 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 10, color: `${regionColor}88`,
                      fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}>
                      QUEST #{quest.order_index + 1} BERIKUTNYA
                    </p>
                    <p style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 15, fontWeight: 700,
                      color: "#F1F5F9", marginBottom: 4,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {nextQuest.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        padding: "1px 8px", borderRadius: 99,
                        border: `1px solid ${DIFF_COLOR[nextQuest.difficulty] ?? "#94A3B8"}44`,
                        background: `${DIFF_COLOR[nextQuest.difficulty] ?? "#94A3B8"}12`,
                        color: DIFF_COLOR[nextQuest.difficulty] ?? "#94A3B8",
                        fontSize: 10, fontFamily: "var(--font-geist-mono)", fontWeight: 700,
                      }}>
                        {DIFF_LABEL[nextQuest.difficulty] ?? nextQuest.difficulty}
                      </span>
                      <span style={{ fontSize: 10, color: "#34D399", fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>
                        +{nextQuest.exp_reward} EXP
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      title="Submit ulang"
                      style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid #1E2D3D", background: "none",
                        color: "#334155", cursor: "pointer", transition: "all .2s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; (e.currentTarget as HTMLElement).style.color = "#64748B"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1E2D3D"; (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                    >
                      <RotateCcw size={13} strokeWidth={2} />
                    </button>

                    <button
                      onClick={() => router.push(`/adventure/${region.slug}/${nextQuest.slug}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "0 20px", height: 40, borderRadius: 9,
                        border: "none", cursor: "pointer",
                        background: regionColor,
                        color: "#080E1A",
                        fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700,
                        letterSpacing: "0.02em",
                        boxShadow: `0 4px 20px ${regionColor}44, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        transition: "all .2s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 28px ${regionColor}66, inset 0 1px 0 rgba(255,255,255,0.2)`;
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${regionColor}44, inset 0 1px 0 rgba(255,255,255,0.15)`;
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      }}
                    >
                      Lanjut
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => { setCode(quest.starter_code ?? ""); setFeedback(null); setOutput(null); }}
                  title="Reset ke kode awal"
                  style={{
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

                <button
                  onClick={handleHint}
                  disabled={hintsLeft === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "0 14px", height: 36, borderRadius: 8, flexShrink: 0,
                    border: "1px solid #FBBF2433", background: "none",
                    color: hintsLeft > 0 ? "#FBBF24" : "#263348",
                    cursor: hintsLeft > 0 ? "pointer" : "not-allowed",
                    fontSize: 12, fontFamily: "var(--font-inter)", transition: "all .2s",
                  }}
                  onMouseEnter={e => { if (hintsLeft > 0) (e.currentTarget as HTMLElement).style.background = "#FBBF2410"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  <Lightbulb size={13} strokeWidth={1.75} />
                  Hint ({hintsLeft})
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !code.trim()}
                  style={{
                    flex: 1, height: 36, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    border: "none", cursor: submitting || !code.trim() ? "not-allowed" : "pointer",
                    background: submitting || !code.trim()
                      ? "#1A2535"
                      : passed ? "#34D399" : regionColor,
                    color: submitting || !code.trim() ? "#334155" : "#080E1A",
                    fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 700,
                    boxShadow: !submitting && !passed && code.trim() ? `0 0 16px ${regionColor}33` : "none",
                    transition: "all .2s",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #33415533", borderTopColor: "#64748B", animation: "spin 1s linear infinite" }} />
                      Memvalidasi...
                    </>
                  ) : passed ? (
                    <><CheckCircle size={14} strokeWidth={2} /> Selesai!</>
                  ) : (
                    <><Play size={13} strokeWidth={2.5} fill="currentColor" /> Submit Quest</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes feedback-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes exp-slide-in {
          from { opacity: 0; transform: translateX(24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}