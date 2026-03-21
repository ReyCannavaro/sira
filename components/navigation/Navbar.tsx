"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Map, Wrench, Users, Trophy, Settings, LogOut, Menu, X } from "lucide-react";

interface NavbarProps {
  username:      string;
  displayName?:  string;
  avatarUrl?:    string | null;
  currentLevel?: number;
}

const NAV_ITEMS = [
  { id: "adventure", label: "Adventure", href: "/adventure", Icon: Map    },
  { id: "workshop",  label: "Workshop",  href: "/workshop",  Icon: Wrench },
  { id: "community", label: "Community", href: "/community", Icon: Users  },
] as const;

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ username, avatarUrl, size = 28 }: {
  username: string; avatarUrl?: string | null; size?: number;
}) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={username}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3))",
      border: "2px solid rgba(34,211,238,0.4)",
      fontFamily: "var(--font-geist-mono)", fontWeight: 700,
      fontSize: size * 0.42, color: "#F8FAFC",
    }}>
      {(username || "H").charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Bordered button (Settings / Logout style dari tim) ─────────────────── */
function BorderBtn({
  children, onClick, activeColor, isActive = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  activeColor?: string;
  isActive?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const col = activeColor ?? "#475569";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "5px 12px", borderRadius: 8, cursor: "pointer",
        fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500,
        transition: "all 0.2s",
        background: isActive
          ? `${col}18`
          : hov ? `${col}0e` : "none",
        border: `1px solid ${isActive ? col : hov ? col + "88" : "#334155"}`,
        color: isActive ? col : hov ? col : "#475569",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function Navbar({ username, displayName, avatarUrl, currentLevel }: NavbarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);
  const label    = displayName || username || "Hero";

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
      }}>

        {/* ── Logo ── */}
        <div onClick={() => router.push("/adventure")}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, #22D3EE, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-geist-mono)", fontWeight: 700, fontSize: 14, color: "#fff",
            boxShadow: "0 0 12px rgba(34,211,238,0.2)",
          }}>
            S
          </div>
          <span style={{
            fontFamily: "var(--font-geist-mono)", fontWeight: 700,
            fontSize: 16, letterSpacing: "0.12em", color: "#F8FAFC",
          }}>
            SIRA
          </span>
        </div>

        {/* ── Center nav items — desktop ── */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 4,
        }} className="nav-desktop">
          {NAV_ITEMS.map(({ id, label: navLabel, href, Icon }) => {
            const active = isActive(href);
            return (
              <button key={id} onClick={() => router.push(href)} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", cursor: "pointer",
                padding: "6px 16px", borderRadius: 8,
                fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 500,
                color: active ? "#22D3EE" : "#475569",
                borderBottom: `2px solid ${active ? "#22D3EE" : "transparent"}`,
                borderTop: "2px solid transparent",
                borderLeft: "none", borderRight: "none",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#475569"; }}
              >
                <Icon size={13} strokeWidth={active ? 2 : 1.75} />
                {navLabel}
              </button>
            );
          })}
        </div>

        {/* ── Right side — desktop ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
          className="nav-desktop">

          {/* Leaderboard */}
          <BorderBtn
            onClick={() => router.push("/leaderboard")}
            activeColor="#F59E0B"
            isActive={isActive("/leaderboard")}
          >
            <Trophy size={14} strokeWidth={1.75} />
          </BorderBtn>

          {/* Profile pill */}
          <div
            onClick={() => router.push("/profile")}
            onMouseEnter={() => setAvatarHovered(true)}
            onMouseLeave={() => setAvatarHovered(false)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 10px 4px 4px", borderRadius: 999, cursor: "pointer",
              background: avatarHovered ? "rgba(34,211,238,0.08)" : "transparent",
              border: `1px solid ${isActive("/profile") ? "#22D3EE" : avatarHovered ? "rgba(34,211,238,0.4)" : "transparent"}`,
              transition: "all 0.2s",
            }}
          >
            <Avatar username={username} avatarUrl={avatarUrl} size={28} />
            <span style={{
              fontSize: 13, fontFamily: "var(--font-inter)",
              color: isActive("/profile") ? "#22D3EE" : avatarHovered ? "#F8FAFC" : "#475569",
              fontWeight: isActive("/profile") ? 600 : 400,
              transition: "color 0.2s",
            }}>
              {label}
            </span>
            {currentLevel !== undefined && (
              <span style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 9, fontWeight: 700,
                color: "#22D3EE", background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.2)",
                padding: "1px 5px", borderRadius: 4, letterSpacing: "0.05em",
              }}>
                LV{currentLevel}
              </span>
            )}
          </div>

          {/* Settings */}
          <BorderBtn
            onClick={() => router.push("/settings")}
            activeColor="#A78BFA"
            isActive={isActive("/settings")}
          >
            <Settings size={14} strokeWidth={1.75} />
          </BorderBtn>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", cursor: logoutLoading ? "not-allowed" : "pointer",
              border: "1px solid #334155", borderRadius: 8,
              padding: "5px 12px", color: "#475569",
              fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500,
              transition: "all 0.2s",
              opacity: logoutLoading ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (!logoutLoading) {
                (e.currentTarget as HTMLElement).style.borderColor = "#F87171";
                (e.currentTarget as HTMLElement).style.color = "#F87171";
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#334155";
              (e.currentTarget as HTMLElement).style.color = "#475569";
            }}
          >
            <LogOut size={13} strokeWidth={1.75} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </div>

        {/* ── Hamburger — mobile ── */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="nav-mobile"
          style={{
            display: "none", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            border: "1px solid #334155", background: "none", cursor: "pointer", color: "#475569",
          }}
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div
          className="nav-mobile"
          style={{
            position: "fixed", top: 60, left: 0, right: 0, zIndex: 99,
            background: "rgba(15,23,42,0.98)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column",
            animation: "drawer-drop .2s ease",
          }}
        >
          {/* User info */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 24px 12px",
            borderBottom: "1px solid #1E293B",
          }}>
            <Avatar username={username} avatarUrl={avatarUrl} size={32} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC", fontFamily: "var(--font-geist-mono)" }}>
                {label}
              </p>
              {currentLevel !== undefined && (
                <p style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>Level {currentLevel}</p>
              )}
            </div>
          </div>

          {/* Nav links */}
          <div style={{ padding: "6px 0" }}>
            {NAV_ITEMS.map(({ id, label: navLabel, href, Icon }) => {
              const active = isActive(href);
              return (
                <button key={id} onClick={() => { router.push(href); setMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    width: "100%", padding: "11px 24px",
                    background: "none", cursor: "pointer",
                    border: "none",
                    borderLeft: `2px solid ${active ? "#22D3EE" : "transparent"}`,
                    color: active ? "#22D3EE" : "#475569",
                    fontSize: 14, fontFamily: "var(--font-inter)", fontWeight: active ? 600 : 400,
                    transition: "all 0.15s",
                  }}>
                  <Icon size={15} strokeWidth={1.75} />
                  {navLabel}
                </button>
              );
            })}

            <button onClick={() => { router.push("/leaderboard"); setMenuOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 24px",
                background: "none", cursor: "pointer", border: "none",
                borderLeft: `2px solid ${isActive("/leaderboard") ? "#F59E0B" : "transparent"}`,
                color: isActive("/leaderboard") ? "#F59E0B" : "#475569",
                fontSize: 14, fontFamily: "var(--font-inter)",
              }}>
              <Trophy size={15} strokeWidth={1.75} />
              Leaderboard
            </button>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #1E293B", padding: "6px 0 8px" }}>
            <button onClick={() => { router.push("/settings"); setMenuOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 24px",
                background: "none", cursor: "pointer", border: "none",
                color: "#475569", fontSize: 14, fontFamily: "var(--font-inter)",
              }}>
              <Settings size={15} strokeWidth={1.75} />
              Settings
            </button>
            <button onClick={handleLogout} disabled={logoutLoading}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 24px",
                background: "none", cursor: "pointer", border: "none",
                color: "#F87171", fontSize: 14, fontFamily: "var(--font-inter)",
                opacity: logoutLoading ? 0.5 : 1,
              }}>
              <LogOut size={15} strokeWidth={1.75} />
              {logoutLoading ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile  { display: none  !important; }
        }
        @media (max-width: 767px) {
          .nav-desktop { display: none  !important; }
          .nav-mobile  { display: flex  !important; }
        }
        @keyframes drawer-drop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}