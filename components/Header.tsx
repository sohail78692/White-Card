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

function HeaderSignInButton() {
  const handleMouseEnter = () => {
    sound.playPop();
  };

  return (
    <Link
      href="/signin"
      onMouseEnter={handleMouseEnter}
      className="relative group overflow-hidden inline-flex items-center gap-2 rounded-full bg-white text-black px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold shadow-[0_2px_12px_rgba(255,255,255,0.2),0_1px_4px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_28px_rgba(255,255,255,0.4),0_0_20px_rgba(56,189,248,0.25)] hover:scale-105 active:scale-95 transition-all duration-300 select-none border border-white/90"
    >
      {/* Specular Diagonal Crystal Sheen on Hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-black/[0.08] to-transparent pointer-events-none" />

      {/* User Icon: Magnetic Hop & Tilt */}
      <div className="relative z-10 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-12 group-hover:scale-110">
        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
      </div>

      {/* Button Text with Smooth Letter Tracking */}
      <span className="relative z-10 tracking-tight group-hover:tracking-wide transition-all duration-300">
        Sign In
      </span>

      {/* Double Arrow Portal Pass: Arrow 1 exits right, Arrow 2 seamlessly glides in from left */}
      <div className="relative z-10 overflow-hidden w-4 h-4 flex items-center justify-center shrink-0">
        <ArrowRight className="h-3.5 w-3.5 text-black/90 transition-all duration-300 ease-out group-hover:translate-x-5 group-hover:opacity-0" />
        <ArrowRight className="h-3.5 w-3.5 text-black absolute transition-all duration-300 ease-out -translate-x-5 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
    </Link>
  );
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, sectionId?: string) => {
    sound.playPop();
    if (pathname === "/" && sectionId) {
      e.preventDefault();
      const lenis = (window as unknown as { __lenis?: { scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number; duration?: number }) => void } }).__lenis;
      if (lenis) {
        if (sectionId === "hero") {
          lenis.scrollTo(0, { duration: 0.85 });
        } else {
          lenis.scrollTo(`#${sectionId}`, { offset: -85, duration: 0.85 });
        }
      } else {
        if (sectionId === "hero") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      }
      setActiveSection(sectionId);
      setMobileMenuOpen(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    sound.playPop();
    if (pathname === "/") {
      e.preventDefault();
      const lenis = (window as unknown as { __lenis?: { scrollTo: (target: number, opts?: { duration?: number }) => void } }).__lenis;
      if (lenis) {
        lenis.scrollTo(0, { duration: 0.85 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setActiveSection("hero");
    }
  };

  return (
    <header className="fixed top-2 sm:top-3 left-0 right-0 z-50 w-full px-2 sm:px-4 md:px-6 transition-all duration-300 pointer-events-none">
      <div className="mx-auto max-w-7xl pointer-events-auto">
        {/* Floating Capsule Bar with subtle 1px border */}
        <div className="relative flex items-center justify-between rounded-full bg-[#0a0f1d]/80 backdrop-blur-2xl px-4 sm:px-6 py-2 border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
          {/* 1. Brand Logo & Title on Left */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 sm:gap-2.5 group transition-all"
              aria-label="White Card Wallet Home"
            >
              <picture className="shrink-0">
                <source srcSet="/logo.webp" type="image/webp" />
                <img
                  src="/logo.png"
                  alt="White Card Logo"
                  width={36}
                  height={36}
                  className="h-8 w-8 sm:h-9 sm:w-9 object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </picture>
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
                    onClick={(e) => handleNavClick(e, item.href, item.sectionId)}
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

          {/* Center Dock Navigation (Authenticated) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.04] p-1 border border-white/5">
              {authNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600/35 text-white shadow-[0_0_14px_rgba(59,130,246,0.4)] border border-blue-400/40"
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
              <HeaderSignInButton />
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
                  onClick={(e) => handleNavClick(e, item.href, item.sectionId)}
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

        {/* Authenticated Floating Sub-bar (Mobile Only) */}
        {user && (
          <div className="mt-2 flex md:hidden justify-center">
            <nav className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0f1d]/90 backdrop-blur-xl border border-white/10 p-1 shadow-lg overflow-x-auto no-scrollbar max-w-full">
              {authNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-blue-600/35 text-white border border-blue-400/40 shadow-sm"
                        : "text-neutral-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-300" : ""}`} />
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
