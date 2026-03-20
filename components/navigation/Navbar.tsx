"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Map, Wrench, Users, Trophy, Settings,
  LogOut, Menu, X, ChevronRight,
} from "lucide-react";

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface NavbarProps {
  username:      string;
  displayName?:  string;
  avatarUrl?:    string | null;
  currentLevel?: number;
}

/* ─── Nav items ──────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "adventure", label: "Adventure", href: "/adventure", Icon: Map     },
  { id: "workshop",  label: "Workshop",  href: "/workshop",  Icon: Wrench  },
  { id: "community", label: "Community", href: "/community", Icon: Users   },
] as const;

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ username, avatarUrl, size = 30 }: {
  username: string; avatarUrl?: string | null; size?: number;
}) {
  const initial = (username || "H").charAt(0).toUpperCase();
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={username}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))",
      border: "1.5px solid rgba(34,211,238,0.35)",
      fontFamily: "var(--font-geist-mono)", fontWeight: 700,
      fontSize: size * 0.42, color: "#22D3EE",
    }}>
      {initial}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function Navbar({ username, displayName, avatarUrl, currentLevel }: NavbarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [profileHover, setProfileHover] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const label = displayName || username || "Hero";

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px",
        background: "rgba(8,14,26,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>

        {/* ── Logo ── */}
        <div onClick={() => router.push("/adventure")} style={{
          display: "flex", alignItems: "center", gap: 9,
          cursor: "pointer", flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #22D3EE, #818CF8)",
            boxShadow: "0 0 14px rgba(34,211,238,0.25)",
            fontFamily: "var(--font-geist-mono)", fontWeight: 800,
            fontSize: 14, color: "#06080F",
          }}>
            S
          </div>
          <span style={{
            fontFamily: "var(--font-geist-mono)", fontWeight: 700,
            fontSize: 15, letterSpacing: "0.16em", color: "#F1F5F9",
          }}>
            SIRA
          </span>
        </div>

        {/* ── Center nav — desktop ── */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 2,
        }}
          className="hidden-mobile"
        >
          {NAV_ITEMS.map(({ id, label: navLabel, href, Icon }) => {
            const active = isActive(href);
            return (
              <button key={id} onClick={() => router.push(href)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8,
                border: "none", cursor: "pointer",
                background: active ? "rgba(34,211,238,0.08)" : "transparent",
                color: active ? "#22D3EE" : "#3D4F6A",
                fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all .18s",
                position: "relative",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#94A3B8" }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#3D4F6A" }}
              >
                <Icon size={13} strokeWidth={active ? 2 : 1.75} />
                {navLabel}
                {/* active underline */}
                {active && (
                  <span style={{
                    position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                    width: "60%", height: 1.5, borderRadius: 99,
                    background: "#22D3EE", boxShadow: "0 0 6px #22D3EE",
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Right side — desktop ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          className="hidden-mobile"
        >
          {/* Leaderboard */}
          <NavIconBtn
            Icon={Trophy}
            active={isActive("/leaderboard")}
            activeColor="#F59E0B"
            title="Leaderboard"
            onClick={() => router.push("/leaderboard")}
          />

          {/* Profile */}
          <div
            onClick={() => router.push("/profile")}
            onMouseEnter={() => setProfileHover(true)}
            onMouseLeave={() => setProfileHover(false)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 10px 5px 6px", borderRadius: 20,
              cursor: "pointer", transition: "all .18s",
              background: isActive("/profile")
                ? "rgba(34,211,238,0.08)"
                : profileHover ? "rgba(255,255,255,0.04)" : "transparent",
              border: `1px solid ${isActive("/profile") ? "rgba(34,211,238,0.3)" : profileHover ? "rgba(255,255,255,0.06)" : "transparent"}`,
            }}
          >
            <Avatar username={username} avatarUrl={avatarUrl} size={26} />
            <span style={{
              fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: isActive("/profile") ? 600 : 400,
              color: isActive("/profile") ? "#22D3EE" : profileHover ? "#C1C9D4" : "#3D4F6A",
              transition: "color .18s", whiteSpace: "nowrap",
            }}>
              {label}
            </span>
            {currentLevel !== undefined && (
              <span style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 9, fontWeight: 700,
                color: "#22D3EE", background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.2)",
                padding: "1px 5px", borderRadius: 4, letterSpacing: "0.06em",
              }}>
                LV{currentLevel}
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.06)", margin: "0 2px" }} />

          {/* Settings */}
          <NavIconBtn
            Icon={Settings}
            active={isActive("/settings")}
            activeColor="#A78BFA"
            title="Settings"
            onClick={() => router.push("/settings")}
          />

          {/* Logout */}
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 10px", borderRadius: 8,
            border: "1px solid transparent", background: "none", cursor: "pointer",
            color: "#2A3A50", fontSize: 12, fontFamily: "var(--font-inter)",
            transition: "all .18s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "#F87171";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.2)";
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.04)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "#2A3A50";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              (e.currentTarget as HTMLElement).style.background = "none";
            }}
          >
            <LogOut size={13} strokeWidth={1.75} />
            Keluar
          </button>
        </div>

        {/* ── Hamburger — mobile ── */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="show-mobile"
          style={{
            display: "none", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "none", cursor: "pointer", color: "#3D4F6A",
          }}
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 56, left: 0, right: 0, zIndex: 49,
          background: "rgba(6,10,20,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          animation: "drawer-down .2s ease",
        }}
          className="show-mobile"
        >
          {/* User row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 20px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <Avatar username={username} avatarUrl={avatarUrl} size={34} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9", fontFamily: "var(--font-geist-mono)" }}>{label}</p>
              {currentLevel !== undefined && (
                <p style={{ fontSize: 10, color: "#22D3EE", fontFamily: "var(--font-geist-mono)" }}>Level {currentLevel}</p>
              )}
            </div>
          </div>

          {/* Nav links */}
          <div style={{ padding: "8px 0" }}>
            {NAV_ITEMS.map(({ id, label: navLabel, href, Icon }) => {
              const active = isActive(href);
              return (
                <button key={id} onClick={() => { router.push(href); setMenuOpen(false); }} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "11px 20px",
                  border: "none", background: active ? "rgba(34,211,238,0.06)" : "none",
                  borderLeft: `2px solid ${active ? "#22D3EE" : "transparent"}`,
                  cursor: "pointer", transition: "all .15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon size={14} strokeWidth={1.75} color={active ? "#22D3EE" : "#3D4F6A"} />
                    <span style={{ fontSize: 13, color: active ? "#22D3EE" : "#3D4F6A", fontWeight: active ? 600 : 400 }}>
                      {navLabel}
                    </span>
                  </div>
                  {active && <ChevronRight size={13} color="#22D3EE" />}
                </button>
              );
            })}

            {/* Leaderboard */}
            <button onClick={() => { router.push("/leaderboard"); setMenuOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 20px",
              border: "none", borderLeft: `2px solid ${isActive("/leaderboard") ? "#F59E0B" : "transparent"}`,
              background: isActive("/leaderboard") ? "rgba(245,158,11,0.06)" : "none", cursor: "pointer",
            }}>
              <Trophy size={14} strokeWidth={1.75} color={isActive("/leaderboard") ? "#F59E0B" : "#3D4F6A"} />
              <span style={{ fontSize: 13, color: isActive("/leaderboard") ? "#F59E0B" : "#3D4F6A" }}>Leaderboard</span>
            </button>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "8px 0 12px" }}>
            <button onClick={() => { router.push("/settings"); setMenuOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 20px",
              border: "none", background: "none", cursor: "pointer",
            }}>
              <Settings size={14} strokeWidth={1.75} color="#3D4F6A" />
              <span style={{ fontSize: 13, color: "#3D4F6A" }}>Settings</span>
            </button>
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 20px",
              border: "none", background: "none", cursor: "pointer",
            }}>
              <LogOut size={14} strokeWidth={1.75} color="#F87171" />
              <span style={{ fontSize: 13, color: "#F87171" }}>Keluar</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile   { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
        @keyframes drawer-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/* ─── Icon button helper ─────────────────────────────────────────────────── */
function NavIconBtn({ Icon, active, activeColor, title, onClick }: {
  Icon: React.ElementType; active: boolean;
  activeColor: string; title: string; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32, borderRadius: 8,
        border: `1px solid ${active ? activeColor + "33" : hov ? "rgba(255,255,255,0.06)" : "transparent"}`,
        background: active ? `${activeColor}10` : hov ? "rgba(255,255,255,0.03)" : "none",
        cursor: "pointer", transition: "all .18s",
        color: active ? activeColor : hov ? "#64748B" : "#2A3A50",
      }}
    >
      <Icon size={14} strokeWidth={active ? 2 : 1.75} />
    </button>
  );
}