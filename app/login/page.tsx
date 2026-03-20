"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Lock, Eye, EyeOff,
  ArrowRight, Loader2, AlertCircle
} from "lucide-react";

type Mode = "login" | "register";
interface FormState { username: string; email: string; password: string; confirm: string; }

function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(34,211,238,0.06) 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 80% 90%, rgba(167,139,250,0.05) 0%, transparent 60%), #060C18"
      }} />

      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="g" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M 52 0 L 0 0 0 52" fill="none" stroke="#94A3B8" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>

      <div className="absolute rounded-full" style={{ width: 640, height: 640, top: "-15%", left: "-12%", background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 65%)", filter: "blur(40px)" }} />
      <div className="absolute rounded-full" style={{ width: 720, height: 720, bottom: "-20%", right: "-15%", background: "radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)", filter: "blur(40px)" }} />

      {[
        { x: "14%", y: "22%", s: 2.5, c: "#22D3EE", delay: "0s",    dur: "4s"  },
        { x: "88%", y: "15%", s: 2,   c: "#A78BFA", delay: "1.2s",  dur: "3.5s"},
        { x: "22%", y: "78%", s: 2,   c: "#22D3EE", delay: "2.1s",  dur: "4.5s"},
        { x: "75%", y: "72%", s: 2.5, c: "#A78BFA", delay: "0.6s",  dur: "3.8s"},
        { x: "94%", y: "42%", s: 2,   c: "#22D3EE", delay: "1.8s",  dur: "4.2s"},
        { x: "6%",  y: "55%", s: 2,   c: "#A78BFA", delay: "0.9s",  dur: "3.6s"},
        { x: "48%", y: "92%", s: 2,   c: "#22D3EE", delay: "1.5s",  dur: "4s"  },
        { x: "35%", y: "8%",  s: 2,   c: "#A78BFA", delay: "2.4s",  dur: "3.4s"},
        { x: "62%", y: "30%", s: 1.5, c: "#22D3EE", delay: "0.3s",  dur: "5s"  },
      ].map((d, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: d.x, top: d.y, width: d.s, height: d.s,
          background: d.c, opacity: 0.35,
          animation: `pulse-glow ${d.dur} ease-in-out infinite`,
          animationDelay: d.delay,
        }} />
      ))}
    </div>
  );
}

function InputField({
  label, type, value, onChange, placeholder, Icon: IconComp,
  rightSlot, onKeyDown, hasError,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  Icon: React.ElementType; rightSlot?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void; hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label style={{
        fontSize: 10, fontFamily: "var(--font-geist-mono)",
        letterSpacing: "0.13em", fontWeight: 600,
        color: hasError ? "#F87171" : focused ? "#22D3EE" : "#3D4F6A",
        transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center",
        background: "rgba(2,6,16,0.6)",
        border: `1px solid ${hasError ? "rgba(248,113,113,0.4)" : focused ? "rgba(34,211,238,0.4)" : "rgba(30,41,59,0.8)"}`,
        borderRadius: 10,
        boxShadow: focused
          ? hasError ? "0 0 0 3px rgba(248,113,113,0.06)" : "0 0 0 3px rgba(34,211,238,0.05)"
          : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}>
        <div style={{
          width: 44, display: "flex", alignItems: "center", justifyContent: "center",
          borderRight: `1px solid ${focused ? "rgba(34,211,238,0.12)" : "rgba(30,41,59,0.6)"}`,
          transition: "border-color 0.2s",
        }}>
          <IconComp size={14} style={{ color: focused ? "#22D3EE" : "#3D4F6A", transition: "color 0.2s" }} />
        </div>
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            padding: "11px 14px", fontSize: 13,
            color: "#E2E8F0", fontFamily: "var(--font-inter)",
          }}
        />
        {rightSlot && <div style={{ paddingRight: 6 }}>{rightSlot}</div>}
      </div>
    </div>
  );
}

function IconBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 32, height: 32, borderRadius: 8,
      background: "none", border: "none", cursor: "pointer",
      color: "#3D4F6A", transition: "color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.color = "#64748B")}
      onMouseLeave={e => (e.currentTarget.style.color = "#3D4F6A")}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [mode,     setMode]     = useState<Mode>("login");
  const [form,     setForm]     = useState<FormState>({ username: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [ready,    setReady]    = useState(false);

  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

  const set = (f: keyof FormState) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const validate = (): string | null => {
    if (!form.email.trim())    return "Email tidak boleh kosong";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Format email tidak valid";
    if (!form.password)        return "Password tidak boleh kosong";
    if (mode === "register") {
      if (!form.username.trim())              return "Username tidak boleh kosong";
      if (form.username.length < 3)           return "Username minimal 3 karakter";
      if (!/^[a-z0-9_]{3,30}$/.test(form.username)) return "Username: huruf kecil, angka, underscore";
      if (form.password.length < 8)           return "Password minimal 8 karakter";
      if (form.password !== form.confirm)     return "Konfirmasi password tidak cocok";
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError(""); setLoading(true);
    try {
      const res  = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login"
          ? { email: form.email, password: form.password }
          : { email: form.email, password: form.password, username: form.username, display_name: form.username }
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? "Terjadi kesalahan. Coba lagi."); return; }
      router.push(mode === "register" ? "/onboarding" : data.data?.user?.hero_class ? "/adventure" : "/onboarding");
    } catch { setError("Koneksi gagal. Periksa internet kamu."); }
    finally   { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); };

  const switchMode = (m: Mode) => { setMode(m); setError(""); setForm({ username: "", email: "", password: "", confirm: "" }); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <Background />

      <div style={{
        padding: "30px 0",
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 400,
        margin: "0 16px",
        opacity: ready ? 1 : 0,
        transform: ready ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>
        <div style={{
          position: "absolute", inset: -1, borderRadius: 20,
          background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(167,139,250,0.06))",
          filter: "blur(16px)", transform: "scale(1.04)",
        }} />

        <div style={{
          position: "relative",
          background: "rgba(8,14,28,0.92)",
          backdropFilter: "blur(32px)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}>
          <div style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.4), rgba(167,139,250,0.35), transparent)",
          }} />

          <div style={{ padding: "36px 36px 32px" }}>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 48, height: 48, borderRadius: 13,
                background: "linear-gradient(135deg, #22D3EE, #818CF8)",
                boxShadow: "0 8px 24px rgba(34,211,238,0.2)",
                marginBottom: 14,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06080F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                  <line x1="13" y1="19" x2="19" y2="13" />
                  <line x1="16" y1="16" x2="20" y2="20" />
                  <line x1="19" y1="21" x2="21" y2="19" />
                </svg>
              </div>

              <div style={{
                fontSize: 20, fontWeight: 800,
                letterSpacing: "0.18em",
                color: "#F1F5F9",
                fontFamily: "var(--font-geist-mono)",
                marginBottom: 5,
              }}>
                SIRA
              </div>
              <div style={{ fontSize: 11, color: "#3D4F6A", letterSpacing: "0.04em" }}>
                Socratic Interactive RPG Academy
              </div>
            </div>

            <div style={{
              display: "flex", gap: 4,
              padding: 4, borderRadius: 12,
              background: "rgba(2,6,16,0.5)",
              border: "1px solid rgba(30,41,59,0.7)",
              marginBottom: 24,
            }}>
              {(["login", "register"] as Mode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: "8px 0",
                  borderRadius: 9,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-geist-mono)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: mode === m
                    ? "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(129,140,248,0.08))"
                    : "transparent",
                  color: mode === m ? "#22D3EE" : "#3D4F6A",
                  border: mode === m ? "1px solid rgba(34,211,238,0.15)" : "1px solid transparent",
                }}>
                  {m === "login" ? "MASUK" : "DAFTAR"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mode === "register" && (
                <InputField label="USERNAME" type="text"
                  value={form.username} onChange={set("username")}
                  placeholder="username_kamu" Icon={User} onKeyDown={handleKey}
                />
              )}

              <InputField label="EMAIL" type="email"
                value={form.email} onChange={set("email")}
                placeholder="kamu@sira.app" Icon={Mail} onKeyDown={handleKey}
                hasError={!!error && error.toLowerCase().includes("email")}
              />

              <InputField label="PASSWORD" type={showPass ? "text" : "password"}
                value={form.password} onChange={set("password")}
                placeholder={mode === "register" ? "Minimal 8 karakter" : "Password"}
                Icon={Lock} onKeyDown={handleKey}
                rightSlot={
                  <IconBtn onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </IconBtn>
                }
              />

              {mode === "register" && (
                <InputField label="KONFIRMASI PASSWORD" type={showPass ? "text" : "password"}
                  value={form.confirm} onChange={set("confirm")}
                  placeholder="Ulangi password" Icon={Lock} onKeyDown={handleKey}
                  hasError={!!form.confirm && form.password !== form.confirm}
                />
              )}

              {mode === "login" && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4 }}>
                  <button style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, color: "#3D4F6A",
                    transition: "color 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#22D3EE")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#3D4F6A")}
                  >
                    Lupa password?
                  </button>
                </div>
              )}

              {error && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(248,113,113,0.05)",
                  border: "1px solid rgba(248,113,113,0.18)",
                }}>
                  <AlertCircle size={14} style={{ color: "#F87171", marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#F87171", lineHeight: 1.5 }}>{error}</span>
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "12px 0",
                borderRadius: 11,
                fontSize: 13, fontWeight: 700,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-geist-mono)",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading
                  ? "rgba(20,30,48,0.8)"
                  : "linear-gradient(135deg, #22D3EE 0%, #818CF8 100%)",
                color: loading ? "#3D4F6A" : "#06080F",
                boxShadow: loading ? "none" : "0 4px 20px rgba(34,211,238,0.18)",
                transition: "all 0.25s",
                marginTop: 4,
              }}>
                {loading
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Memproses...</>
                  : <>{mode === "login" ? "Mulai Petualangan" : "Buat Akun"} <ArrowRight size={15} strokeWidth={2.5} /></>
                }
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(30,41,59,0.7)" }} />
              <span style={{ fontSize: 10, color: "#1E2D42", letterSpacing: "0.12em", fontFamily: "var(--font-geist-mono)" }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: "rgba(30,41,59,0.7)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                {
                  label: "Google",
                  icon: <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
                  onClick: () => { window.location.href = "/api/auth/oauth/google"; },
                },
                {
                  label: "GitHub",
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#94A3B8"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>,
                  onClick: () => {},
                },
              ].map(({ label, icon, onClick }) => (
                <button key={label} onClick={onClick} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 0", borderRadius: 10,
                  fontSize: 12, fontWeight: 500,
                  background: "rgba(2,6,16,0.5)",
                  border: "1px solid rgba(30,41,59,0.7)",
                  color: "#4A5E7A", cursor: "pointer",
                  fontFamily: "var(--font-inter)",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,211,238,0.2)";
                    (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                    (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.03)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,41,59,0.7)";
                    (e.currentTarget as HTMLElement).style.color = "#4A5E7A";
                    (e.currentTarget as HTMLElement).style.background = "rgba(2,6,16,0.5)";
                  }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            <p style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: "#2A3A50" }}>
              {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
              <button onClick={() => switchMode(mode === "login" ? "register" : "login")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "#22D3EE",
                transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#67E8F9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#22D3EE")}
              >
                {mode === "login" ? "Daftar sekarang" : "Masuk"}
              </button>
            </p>
          </div>
        </div>

        <p style={{
          textAlign: "center", marginTop: 20,
          fontSize: 9, letterSpacing: "0.22em",
          color: "#111827", fontFamily: "var(--font-geist-mono)",
        }}>
          SIRA v2.0 · NEURAL NETWORK
        </p>
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}