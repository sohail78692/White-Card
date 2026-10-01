"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sound } from "@/lib/sound";
import {
  Shield,
  CreditCard,
  FolderLock,
  Share2,
  FileCheck2,
  Volume2,
  VolumeX,
  LogOut,
  QrCode,
  Activity,
} from "lucide-react";

interface HeaderStats {
  linkedDocs: number;
  verificationsToday: number;
  auditEntries: number;
}

export function Header() {
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);
  const [stats, setStats] = useState<HeaderStats>({
    linkedDocs: 0,
    verificationsToday: 0,
    auditEntries: 0,
  });
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    setMuted(sound.isMuted());

    // Fetch user and stats
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setStats(data.stats || { linkedDocs: 0, verificationsToday: 0, auditEntries: 0 });
        }
      } catch {
        // Not logged in or fetch failed
      }
    };
    fetchStatus();
  }, [pathname]);

  const toggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.playSuccess();
    }
  };

  const navLinks = [
    { href: "/wallet", label: "Wallet", icon: CreditCard },
    { href: "/vault", label: "Vault", icon: FolderLock },
    { href: "/share", label: "Share", icon: Share2 },
    { href: "/privacy", label: "Privacy Center", icon: Shield },
    { href: "/verify", label: "Verify Portal", icon: QrCode },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition hover:opacity-90"
            aria-label="White Card Wallet Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-glow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">WHITE CARD</span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                Secure Wallet
              </span>
            </div>
          </Link>

          {/* Desktop Live Counters */}
          {user && (
            <div className="hidden lg:flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 border border-white/5 text-slate-300">
                <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                <span>Linked: <strong className="text-white">{stats.linkedDocs}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 border border-white/5 text-slate-300">
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Verifications: <strong className="text-white">{stats.verificationsToday}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 border border-white/5 text-slate-300">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>Audit Logs: <strong className="text-white">{stats.auditEntries}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            aria-label={muted ? "Unmute audio feedback" : "Mute audio feedback"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
          </button>

          {/* User state / Sign in button */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs text-slate-300 font-medium">
                {user.name || user.email}
              </span>
              <button
                onClick={async () => {
                  await fetch("/api/auth/signout", { method: "POST" });
                  window.location.href = "/";
                }}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/40 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/#auth"
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Bar (Desktop + Mobile scrollable pill bar) */}
      <div className="border-t border-white/5 bg-slate-950/60 px-4 py-1.5 overflow-x-auto no-scrollbar">
        <nav className="mx-auto flex max-w-7xl items-center gap-1.5 sm:gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
