"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Mode = "login" | "register";

interface FormState {
  username: string;
  email: string;
  password: string;
  confirm: string;
}

function NeuralBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]">
        <defs>
          <pattern
            id="login-grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#334155"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>

      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "15%",
          left: "10%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: "10%",
          right: "8%",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)",
        }}
      />

      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse-glow"
          style={{
            left: `${10 + ((i * 37) % 80)}%`,
            top: `${5 + ((i * 53) % 90)}%`,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            background: i % 2 === 0 ? "#22D3EE" : "#A78BFA",
            opacity: 0.2 + (i % 4) * 0.1,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + (i % 3)}s`,
          }}
        />
      ))}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: string;
  rightAction?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  error?: boolean;
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  rightAction,
  onKeyDown,
  error,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        className="block mb-1.5 text-[11px] tracking-widest font-medium"
        style={{
          fontFamily: "var(--font-geist-mono)",
          color: error ? "#F87171" : focused ? "#22D3EE" : "#475569",
          transition: "color 0.2s",
        }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: "#070F1A",
          border: `1px solid ${
            error ? "#F87171" : focused ? "#22D3EE" : "#334155"
          }`,
          boxShadow: focused
            ? error
              ? "0 0 0 3px rgba(248,113,113,0.1)"
              : "0 0 0 3px rgba(34,211,238,0.1)"
            : "none",
        }}
      >
        <span
          className="px-3 text-base shrink-0 border-r transition-colors duration-200"
          style={{
            borderColor: focused ? "#22D3EE33" : "#1E293B",
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-ghost-white placeholder-text-muted"
          style={{ fontFamily: "var(--font-inter)" }}
        />
        {rightAction}
      </div>
    </div>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all duration-200"
      style={{
        background: "#070F1A",
        border: `1px solid ${hovered ? "rgba(34,211,238,0.4)" : "#334155"}`,
        color: hovered ? "#F8FAFC" : "#94A3B8",
        fontFamily: "var(--font-inter)",
        fontWeight: 500,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const setField = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.email.trim()) return "Email tidak boleh kosong";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Format email tidak valid";
    if (!form.password.trim()) return "Password tidak boleh kosong";

    if (mode === "register") {
      if (!form.username.trim()) return "Username tidak boleh kosong";
      if (form.username.length < 3) return "Username minimal 3 karakter";
      if (!/^[a-z0-9_]{3,30}$/.test(form.username))
        return "Username hanya boleh huruf kecil, angka, dan underscore";
      if (form.password.length < 8) return "Password minimal 8 karakter";
      if (form.password !== form.confirm) return "Password tidak cocok";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationErr = validate();
    if (validationErr) return setError(validationErr);
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              username: form.username,
              display_name: form.username,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
        return;
      }

      if (mode === "register") {
        router.push("/onboarding");
      } else {
        const hasHeroClass = data.data?.user?.hero_class;
        router.push(hasHeroClass ? "/adventure" : "/onboarding");
      }
    } catch {
      setError("Koneksi gagal. Periksa internet kamu.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError("");
    setForm({ username: "", email: "", password: "", confirm: "" });
  };

  const handleGoogle = () => {
    window.location.href = "/api/auth/oauth/google";
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center"
      style={{ background: "#0F172A" }}
    >
      <NeuralBackground />

      <div
        className="relative z-10 w-full mx-4 transition-all duration-500"
        style={{
          maxWidth: 440,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
        }}
      >
        <div
          className="rounded-2xl p-10"
          style={{
            background: "rgba(30,41,59,0.8)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow:
              "0 0 80px rgba(34,211,238,0.05), 0 32px 64px rgba(0,0,0,0.5)",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #22D3EE, #A78BFA)",
                boxShadow: "0 0 32px rgba(34,211,238,0.35)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              S
            </div>
            <h1
              className="text-xl font-bold tracking-widest text-ghost-white mb-1.5"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              SIRA
            </h1>
            <p className="text-xs text-text-muted tracking-wide">
              Socratic Interactive RPG Academy
            </p>
          </div>

          <div
            className="flex rounded-xl p-1 mb-7"
            style={{
              background: "#070F1A",
              border: "1px solid #1E293B",
            }}
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200",
                  mode === m
                    ? "text-neon-cyan"
                    : "text-text-muted hover:text-text-secondary"
                )}
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  background:
                    mode === m
                      ? "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(167,139,250,0.12))"
                      : "transparent",
                  borderBottom:
                    mode === m ? "2px solid #22D3EE" : "2px solid transparent",
                }}
              >
                {m === "login" ? "MASUK" : "DAFTAR"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {mode === "register" && (
              <InputField
                label="USERNAME"
                type="text"
                value={form.username}
                onChange={setField("username")}
                placeholder="hero_name_123"
                icon="👤"
                onKeyDown={handleKey}
              />
            )}

            <InputField
              label="EMAIL"
              type="email"
              value={form.email}
              onChange={setField("email")}
              placeholder="hero@sira.app"
              icon="✉️"
              onKeyDown={handleKey}
              error={!!error && error.includes("email")}
            />

            <InputField
              label="PASSWORD"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={setField("password")}
              placeholder="••••••••"
              icon="🔑"
              onKeyDown={handleKey}
              rightAction={
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="px-3 text-text-muted hover:text-text-secondary transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              }
            />

            {mode === "register" && (
              <InputField
                label="KONFIRMASI PASSWORD"
                type={showPass ? "text" : "password"}
                value={form.confirm}
                onChange={setField("confirm")}
                placeholder="••••••••"
                icon="🔒"
                onKeyDown={handleKey}
                error={!!form.confirm && form.password !== form.confirm}
              />
            )}

            {mode === "login" && (
              <div className="flex justify-end -mt-1">
                <button
                  className="text-xs text-text-muted hover:text-neon-cyan transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  Lupa password?
                </button>
              </div>
            )}

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-neon-rose"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  animation: "scale-in 0.2s ease",
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 mt-1 overflow-hidden"
              style={{
                fontFamily: "var(--font-geist-mono)",
                background: loading
                  ? "#1E293B"
                  : "linear-gradient(135deg, #22D3EE, #A78BFA)",
                color: loading ? "#475569" : "#0F172A",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading
                  ? "none"
                  : "0 0 24px rgba(34,211,238,0.25)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    ⟳
                  </span>
                  {mode === "login"
                    ? "Memasuki dunia..."
                    : "Membuat akun..."}
                </span>
              ) : (
                <span>
                  {mode === "login" ? "⚔️ Mulai Petualangan" : "🚀 Buat Akun"}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-deep-slate" />
            <span className="text-xs text-text-muted">atau lanjutkan dengan</span>
            <div className="flex-1 h-px bg-deep-slate" />
          </div>

          <div className="flex gap-3">
            <SocialButton icon="🌐" label="Google" onClick={handleGoogle} />
            <SocialButton icon="🐙" label="GitHub" />
          </div>

          <p className="text-center mt-6 text-xs text-text-muted">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
              className="text-neon-cyan font-semibold hover:underline transition-all"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              {mode === "login" ? "Daftar sekarang →" : "Masuk →"}
            </button>
          </p>
        </div>

        <p
          className="text-center mt-6 text-[10px] tracking-widest"
          style={{
            color: "#1E293B",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          SIRA v2.0 · CYBER-TECH MINIMALIST · THE NEURAL NETWORK
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}