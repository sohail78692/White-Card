"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sound } from "@/lib/sound";
import {
  Home,
  Box,
  BookOpen,
  ShieldCheck,
  Volume2,
  VolumeX,
  User,
  ArrowRight,
  LogOut,
  CreditCard,
  FolderLock,
  Share2,
  Shield,
  Menu,
  X,
  FileCheck2,
  Activity,
  Layers,
  Sun,
} from "lucide-react";



interface HeaderStats {
  linkedDocs: number;
  verificationsToday: number;
  auditEntries: number;
}

export function Header() {
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const [stats, setStats] = useState<HeaderStats>({
    linkedDocs: 0,
    verificationsToday: 0,
    auditEntries: 0,
  });
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    setMuted(sound.isMuted());

    // Track which section is in view via IntersectionObserver
    const sectionIds = ["hero", "documents", "how-it-works", "features", "security"];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    // Fetch user and stats
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setStats(data.stats || { linkedDocs: 0, verificationsToday: 0, auditEntries: 0 });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    fetchStatus();

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [pathname]);

  const toggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.playSuccess();
    }
  };

  const landingLinks = [
    { href: "/", label: "Home", icon: Home, sectionId: "hero" },
    { href: "/#documents", label: "4 Supported IDs", icon: Box, sectionId: "documents" },
    { href: "/#how-it-works", label: "How It Works", icon: BookOpen, sectionId: "how-it-works" },
    { href: "/#features", label: "Features", icon: Layers, sectionId: "features" },
    { href: "/#security", label: "Security", icon: ShieldCheck, sectionId: "security" },
  ];

  const authNavLinks = [
    { href: "/wallet", label: "Wallet", icon: CreditCard },
    { href: "/vault", label: "Vault", icon: FolderLock },
    { href: "/share", label: "Share", icon: Share2 },
    { href: "/privacy", label: "Privacy Center", icon: Shield },
  ];

  return (
    <header className="fixed top-2 sm:top-3 left-0 right-0 z-50 w-full px-2 sm:px-4 md:px-6 transition-all duration-300 pointer-events-none">
      <div className="mx-auto max-w-7xl pointer-events-auto">
        {/* Floating Capsule Bar with subtle 1px border */}
        <div className="relative flex items-center justify-between rounded-full bg-[#0a0f1d]/80 backdrop-blur-2xl px-4 sm:px-6 py-2 border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
          {/* 1. Brand Logo & Title on Left */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-2.5 group transition-all"
              aria-label="White Card Wallet Home"
            >
              <img
                src="/logo.png"
                alt="White Card Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold tracking-wider text-white leading-tight">
                  WHITE <span className="text-[#38bdf8]">CARD</span>
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-semibold leading-tight mt-0.5">
                  SECURE WALLET
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center Dock Navigation (Unauthenticated) */}
          {!user && (
            <nav className="hidden lg:flex items-center gap-1 rounded-full bg-white/[0.04] p-1 border border-white/5">
              {landingLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.sectionId;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-3.5 xl:px-4 py-1.5 text-xs transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600/35 text-white font-semibold shadow-[0_0_16px_rgba(59,130,246,0.45)] border border-blue-400/50"
                        : "text-neutral-300 hover:text-white hover:bg-white/10 font-medium"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-300" : "text-neutral-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Center Live Counters (Authenticated Only) */}
          {user && (
            <div className="hidden md:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 border border-white/10 text-neutral-300 shadow-sm">
                <CreditCard className="h-3.5 w-3.5 text-neutral-300" />
                <span>Linked: <strong className="text-white font-mono">{stats.linkedDocs}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 border border-white/10 text-neutral-300 shadow-sm">
                <FileCheck2 className="h-3.5 w-3.5 text-neutral-300" />
                <span>Verifications: <strong className="text-white font-mono">{stats.verificationsToday}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 border border-white/10 text-neutral-300 shadow-sm">
                <Activity className="h-3.5 w-3.5 text-neutral-300" />
                <span>Audit: <strong className="text-white font-mono">{stats.auditEntries}</strong></span>
              </div>
            </div>
          )}

          {/* 3. Right Side Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Sound Audio Toggle Button */}
            <button
              onClick={toggleSound}
              aria-label={muted ? "Unmute audio feedback" : "Mute audio feedback"}
              title={muted ? "Sound muted (click to unmute)" : "Sound enabled (click to mute)"}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 hover:border-white/30 hover:text-white active:scale-95 transition-all shadow-sm"
            >
              {muted ? (
                <VolumeX className="h-4 w-4 text-neutral-400 hover:text-white transition-colors" />
              ) : (
                <Volume2 className="h-4 w-4 text-neutral-300 hover:text-white transition-colors" />
              )}
            </button>

            {/* User Session or Clean Luxury Monochrome Sign In Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-xs text-neutral-200 font-medium">
                  {user.name || user.email}
                </span>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/signout", { method: "POST" });
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-3.5 py-1.5 text-xs text-red-300 hover:bg-red-900/50 hover:text-white active:scale-95 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                className="relative flex items-center gap-1.5 sm:gap-2 rounded-full bg-white hover:bg-neutral-100 text-black px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/80" />
              </Link>
            )}

            {/* Mobile Menu Toggle (Visible below lg for unauthenticated) */}
            {!user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                className="flex lg:hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white transition"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Drawer for Navigation Links */}
        {!user && mobileMenuOpen && (
          <div className="mt-2 lg:hidden rounded-2xl bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 p-3 shadow-xl space-y-1">
            {landingLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.sectionId;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs transition ${
                    isActive
                      ? "bg-blue-600/35 text-white font-semibold border border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                      : "text-neutral-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-300" : "text-neutral-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Authenticated Floating Sub-bar */}
        {user && (
          <div className="mt-2 flex justify-center">
            <nav className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur-xl border border-white/10 p-1 shadow-lg overflow-x-auto no-scrollbar max-w-full">
              {authNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

    </header>
  );
}
