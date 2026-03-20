"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface NavbarProps {
  username:     string;
  displayName?: string;
  avatarUrl?:   string | null;
  currentLevel?: number;
  totalExp?:    number;
}

interface NavItem {
  id:    string;
  label: string;
  href:  string;
  icon:  string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "adventure", label: "Adventure", href: "/adventure", icon: "🗺️" },
  { id: "workshop",  label: "Workshop",  href: "/workshop",  icon: "⚙️" },
  { id: "community", label: "Community", href: "/community", icon: "👥" },
];

function Avatar({
  username,
  avatarUrl,
  size = 30,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-ghost-white shrink-0"
      style={{
        width:      size,
        height:     size,
        fontSize:   size * 0.45,
        background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3))",
        border:     "2px solid rgba(34,211,238,0.4)",
      }}
    >
      {(username || "H").charAt(0).toUpperCase()}
    </div>
  );
}

export default function Navbar({
  username,
  displayName,
  avatarUrl,
}: NavbarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [avatarHovered, setAvatarHovered] = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const displayLabel = displayName || username || "Hero";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-[60px]"
      style={{
        background:   "rgba(15,23,42,0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center gap-2.5 cursor-pointer shrink-0"
        onClick={() => router.push("/adventure")}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{
            background:  "linear-gradient(135deg, #22D3EE, #A78BFA)",
            fontFamily:  "var(--font-geist-mono)",
          }}
        >
          S
        </div>
        <span
          className="font-bold text-base tracking-widest text-ghost-white"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          SIRA
        </span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border-b-2",
              isActive(item.href)
                ? "text-neon-cyan border-neon-cyan"
                : "text-text-muted border-transparent hover:text-text-secondary"
            )}
            style={{ fontFamily: "var(--font-inter)", background: "none" }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0">

        <button
          onClick={() => router.push("/leaderboard")}
          className={cn(
            "hidden md:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
            isActive("/leaderboard")
              ? "text-neon-amber bg-neon-amber/10 border border-neon-amber/30"
              : "text-text-muted hover:text-text-secondary border border-transparent"
          )}
          title="Leaderboard"
          style={{ background: "none" }}
        >
          🏆
        </button>

        <div
          onClick={() => router.push("/profile")}
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
          className="hidden md:flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-full transition-all duration-200"
          style={{
            background: avatarHovered ? "rgba(34,211,238,0.08)" : "transparent",
            border: `1px solid ${
              isActive("/profile")
                ? "#22D3EE"
                : avatarHovered
                ? "rgba(34,211,238,0.4)"
                : "transparent"
            }`,
          }}
        >
          <Avatar username={username} avatarUrl={avatarUrl} size={28} />
          <span
            className="text-sm transition-colors duration-200"
            style={{
              color: isActive("/profile")
                ? "#22D3EE"
                : avatarHovered
                ? "#F8FAFC"
                : "#94A3B8",
              fontWeight: isActive("/profile") ? 600 : 400,
            }}
          >
            {displayLabel}
          </span>
        </div>

        <button
          onClick={() => router.push("/settings")}
          className={cn(
            "hidden md:flex items-center justify-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
            isActive("/settings")
              ? "text-neon-violet bg-neon-violet/10 border border-neon-violet/30"
              : "text-text-muted border border-deep-slate hover:text-text-secondary"
          )}
          style={{ background: isActive("/settings") ? undefined : "none" }}
        >
          ⚙️
        </button>

        <button
          onClick={handleLogout}
          className="hidden md:flex items-center px-3 py-1.5 rounded-lg text-sm text-text-muted border border-deep-slate transition-all duration-200 hover:text-neon-rose hover:border-neon-rose/50"
          style={{ background: "none", fontFamily: "var(--font-inter)" }}
        >
          Logout
        </button>

        <button
          className="md:hidden flex flex-col gap-1 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-5 h-0.5 bg-text-muted rounded-full transition-all duration-200"
            />
          ))}
        </button>
      </div>

      {menuOpen && (
        <div
          className="absolute top-[60px] left-0 right-0 md:hidden flex flex-col py-2"
          style={{
            background:   "rgba(15,23,42,0.98)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { router.push(item.href); setMenuOpen(false); }}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                isActive(item.href) ? "text-neon-cyan" : "text-text-muted"
              )}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="h-px bg-deep-slate mx-6 my-1" />

          <button
            onClick={() => { router.push("/profile"); setMenuOpen(false); }}
            className="flex items-center gap-3 px-6 py-3 text-sm text-text-muted"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Avatar username={username} avatarUrl={avatarUrl} size={20} />
            <span>{displayLabel}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-3 text-sm text-neon-rose"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}