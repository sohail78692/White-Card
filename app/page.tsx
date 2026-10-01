"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  History,
  QrCode,
  ArrowRight,
  FileKey2,
  CheckCircle2,
  Car,
  CreditCard,
  Vote,
  ShoppingBag,
  FileCheck,
  Cpu,
  Layers,
  Fingerprint,
  Wallet,
  Zap,
  Play,
  ChevronRight,
  MoreHorizontal,
  Wheat,
  Users,
  FileText,
} from "lucide-react";

export default function HomePage() {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14;
    setTilt({ x: y, y: x, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, isHovered: false });
  };

  return (
    <div className="relative space-y-12 sm:space-y-16 pt-0 pb-12 overflow-hidden bg-black">
      {/* 1. Hero Section (Two-Column Layout with 3D Glass Wallet Mockup) */}
      <section id="hero" className="relative max-w-7xl mx-auto pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8">
        {/* Subtle Dark Ambient Background Curves matching screenshot */}
        <div className="absolute top-4 -left-20 w-[55vw] max-w-[600px] h-[600px] bg-gradient-to-br from-[#07132e]/60 via-[#050b1a]/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-10 left-0 right-0 h-40 bg-gradient-to-t from-[#050c1b]/50 via-[#030711]/20 to-transparent pointer-events-none -z-10" />

        {/* 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 xl:col-span-7 text-left space-y-5 lg:space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/10 px-3 py-1 text-[9px] sm:text-[10px] font-semibold text-neutral-300 tracking-[0.15em] uppercase backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
              <span>ONE WALLET. FOUR IDENTITY DOCUMENTS.</span>
            </div>

            {/* Bold Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-black tracking-tight text-white leading-[1.08]">
              Your personal <br />
              <span className="bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#3b82f6] bg-clip-text text-transparent">
                identity
              </span>{" "}
              wallet.
            </h1>

            {/* Subtitle Description */}
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal max-w-lg">
              Store your <strong className="text-white font-semibold">Driving License (DL)</strong>, <strong className="text-white font-semibold">PAN Card</strong>,{" "}
              <strong className="text-white font-semibold">Voter ID (EPIC)</strong>, and <strong className="text-white font-semibold">Ration Card</strong> in a client-encrypted vault. Prove claims via signed, expiring, revocable QR tokens with zero raw PII leakage.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/signin"
                className="group flex items-center gap-2.5 rounded-full bg-white hover:bg-neutral-100 text-black px-6 sm:px-7 py-3 text-xs sm:text-sm font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15),0_2px_6px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_24px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Wallet className="h-4 w-4 text-black" />
                <span>Open Wallet</span>
                <ArrowRight className="h-4 w-4 text-black/80 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2.5 rounded-full border border-white/[0.14] bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/[0.22] hover:text-white px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-neutral-200 active:scale-95 transition-all duration-200 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              >
                <Layers className="h-4 w-4 text-white/90" />
                <span>Explore Features</span>
              </a>
            </div>
          </div>

          {/* Right Column: 3D Stacked Glass Wallet Mockup (Interactive Hover & 3D Tilt) */}
          <div className="lg:col-span-5 xl:col-span-5 relative flex justify-center lg:justify-center items-center pt-2 lg:pt-0">
            {/* Mockup Card Interactive Area Wrapper */}
            <div
              className="group/stack relative w-full max-w-[315px] sm:max-w-[385px] lg:max-w-[415px] lg:-translate-x-8 xl:-translate-x-12 cursor-pointer perspective-1000 py-3"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Subtle Ambient Backing (Soft, no harsh glow) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[340px] h-[240px] sm:h-[300px] bg-blue-500/[0.07] group-hover/stack:bg-blue-500/[0.11] blur-3xl pointer-events-none rounded-full transition-colors duration-500" />

              {/* Stack Layer 4 (Left Peeking Curved Card Edge) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-md pointer-events-none shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(-12px, 6px, -40px) rotateX(${tilt.x * 0.4}deg) rotateY(${tilt.y * 0.4}deg) rotate(-7deg)`
                    : "translate3d(-8px, 4px, 0) rotate(-5deg)",
                  transition: tilt.isHovered ? "transform 0.14s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Stack Layer 3 (Furthest Back Glass Sheet) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.1] bg-white/[0.03] backdrop-blur-lg pointer-events-none shadow-[0_12px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(36px, -18px, -30px) rotateX(${tilt.x * 0.5}deg) rotateY(${tilt.y * 0.5}deg) rotate(6deg)`
                    : "translate3d(28px, -14px, 0) rotate(4.5deg)",
                  transition: tilt.isHovered ? "transform 0.14s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Stack Layer 2 (Middle Glass Sheet) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.12] bg-white/[0.04] backdrop-blur-xl pointer-events-none shadow-[0_14px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(24px, -12px, -20px) rotateX(${tilt.x * 0.65}deg) rotateY(${tilt.y * 0.65}deg) rotate(3.8deg)`
                    : "translate3d(18px, -9px, 0) rotate(2.5deg)",
                  transition: tilt.isHovered ? "transform 0.12s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Stack Layer 1 (Immediate Back Frosted Glass Sheet) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.14] bg-[#0c1220]/75 backdrop-blur-xl pointer-events-none shadow-[0_16px_36px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(13px, -6px, -10px) rotateX(${tilt.x * 0.8}deg) rotateY(${tilt.y * 0.8}deg) rotate(1.6deg)`
                    : "translate3d(9px, -4px, 0) rotate(0.5deg)",
                  transition: tilt.isHovered ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Main Front Glass Wallet Device Card (Interactive 3D Tilt) */}
              <div
                className="relative z-10 w-full rounded-[26px] p-4 sm:p-5 bg-gradient-to-b from-[#131b2e]/85 via-[#0d1424]/80 to-[#080d18]/85 backdrop-blur-2xl border border-white/[0.15] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1.5px_1px_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(0,0,0,0.5)] group-hover/stack:border-white/[0.22] group-hover/stack:shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.5)]"
                style={{
                  transform: tilt.isHovered
                    ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotate(-0.5deg) scale3d(1.02, 1.02, 1.02)`
                    : "rotate(-2.5deg)",
                  transition: tilt.isHovered
                    ? "transform 0.08s ease-out, border-color 0.3s ease, box-shadow 0.3s ease"
                    : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s ease, box-shadow 0.5s ease",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3.5 sm:pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] group-hover/stack:scale-105 transition-transform duration-300">
                      <Wallet className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold tracking-wide text-white leading-tight">
                        WHITE <span className="text-[#38bdf8]">CARD</span>
                      </div>
                      <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.22em] text-neutral-400 font-bold leading-tight mt-0.5">
                        SECURE WALLET
                      </div>
                    </div>
                  </div>
                  <div className="text-neutral-400 hover:text-white transition p-1 cursor-pointer">
                    <MoreHorizontal className="h-5 w-5 text-neutral-300" />
                  </div>
                </div>

                {/* 2x2 Grid of 4 Supported Documents (iOS Glass Cells with Hover States) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {/* 1. Driving License */}
                  <div className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2 sm:p-2.5 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center text-white shadow-sm shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          Driving License
                        </div>
                        <div className="text-[8px] sm:text-[9px] text-neutral-400 font-normal leading-tight mt-0.5">
                          (DL)
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </div>

                  {/* 2. PAN Card */}
                  <div className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2 sm:p-2.5 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shadow-sm shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          PAN Card
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </div>

                  {/* 3. Voter ID */}
                  <div className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2 sm:p-2.5 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white shadow-sm shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          Voter ID
                        </div>
                        <div className="text-[8px] sm:text-[9px] text-neutral-400 font-normal leading-tight mt-0.5">
                          (EPIC)
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </div>

                  {/* 4. Ration Card */}
                  <div className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2 sm:p-2.5 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center text-white shadow-sm shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <Wheat className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          Ration Card
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3.5 sm:pt-4 pb-0 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-neutral-400 font-medium">
                  <Lock className="h-3 w-3 text-neutral-400" />
                  <span>4 documents · one secure wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Highlights (iOS Glass Squircles with Clean Dividers) */}
        <div className="pt-10 sm:pt-14 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 px-2">
          {/* 1. Client Encrypted */}
          <div className="flex items-center gap-4 flex-1">
            <div className="h-11 w-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-tight">Client Encrypted</div>
              <div className="text-xs text-neutral-400 leading-normal mt-0.5">Your data, your control</div>
            </div>
          </div>

          {/* Divider 1 */}
          <div className="hidden md:block h-9 w-px bg-white/10 shrink-0" aria-hidden="true" />

          {/* 2. Zero PII Leakage */}
          <div className="flex items-center gap-4 flex-1 md:justify-center">
            <div className="h-11 w-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-tight">Zero PII Leakage</div>
              <div className="text-xs text-neutral-400 leading-normal mt-0.5">Share only what&apos;s needed</div>
            </div>
          </div>

          {/* Divider 2 */}
          <div className="hidden md:block h-9 w-px bg-white/10 shrink-0" aria-hidden="true" />

          {/* 3. Fast & Secure */}
          <div className="flex items-center gap-4 flex-1 md:justify-end">
            <div className="h-11 w-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-tight">Fast & Secure</div>
              <div className="text-xs text-neutral-400 leading-normal mt-0.5">Instant, verifiable tokens</div>
            </div>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section id="documents" className="scroll-mt-28 space-y-8 max-w-5xl mx-auto pt-4 sm:pt-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3.5 py-1 text-xs font-semibold text-neutral-200">
            <FileCheck className="h-3.5 w-3.5 text-white" />
            <span>Focused & Streamlined</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            4 Core Supported Documents
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            Cleanly designed for the 4 most vital personal Indian credentials, each with tailored
            formatting, masking, and selective disclosure attributes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 1. Driving License Widget */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/25 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 text-white shadow-sm">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Driving License (DL)</h3>
                  <span className="text-[11px] text-neutral-400 font-medium">Category: Identity & Transit</span>
                </div>
              </div>
              <span className="rounded-full glass-ios-pill px-3 py-0.5 text-[10px] text-neutral-300 font-mono">
                15-16 chars
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Standardized format with state code and RTO numeric validation. Enables quick traffic
              inspection and emergency organ-donor indication without revealing your home address.
            </p>
            <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-2 text-[11px]">
              <span className="text-neutral-400 font-medium block">Selective Claims Available:</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Vehicle Classes</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Organ Donor</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">RTO Code</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Expiry Date</span>
              </div>
            </div>
          </div>

          {/* 2. PAN Card Widget */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/25 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 text-white shadow-sm">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">PAN Card</h3>
                  <span className="text-[11px] text-neutral-400 font-medium">Category: Financial Identity</span>
                </div>
              </div>
              <span className="rounded-full glass-ios-pill px-3 py-0.5 text-[10px] text-neutral-300 font-mono">
                10 chars
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Strict regex validation (5 letters, 4 digits, 1 letter). Secure UI masking (e.g.{" "}
              <code className="text-white font-mono font-semibold">AB••••••F</code>) protects your financial
              identifier from casual observers and shoulder surfers.
            </p>
            <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-2 text-[11px]">
              <span className="text-neutral-400 font-medium block">Selective Claims Available:</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Taxpayer Category</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Father&apos;s Name</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Masked ID Number</span>
              </div>
            </div>
          </div>

          {/* 3. Voter ID Widget */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/25 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 text-white shadow-sm">
                  <Vote className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Voter ID (EPIC)</h3>
                  <span className="text-[11px] text-neutral-400 font-medium">Category: Civic & Election</span>
                </div>
              </div>
              <span className="rounded-full glass-ios-pill px-3 py-0.5 text-[10px] text-neutral-300 font-mono">
                10 chars
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Election Commission of India (EPIC) alphanumeric verification. Provides instant single-voting
              check-in at polling booths to mathematically prevent double-vote abuse.
            </p>
            <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-2 text-[11px]">
              <span className="text-neutral-400 font-medium block">Selective Claims Available:</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Assembly Constituency</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Polling Booth</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Single-Checkin Token</span>
              </div>
            </div>
          </div>

          {/* 4. Ration Card Widget */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/25 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 text-white shadow-sm">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ration Card</h3>
                  <span className="text-[11px] text-neutral-400 font-medium">Category: Food & Public Distribution</span>
                </div>
              </div>
              <span className="rounded-full glass-ios-pill px-3 py-0.5 text-[10px] text-neutral-300 font-mono">
                8-18 chars
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Department of Food & Civil Supplies schema with NFSA scheme tracking. Connects directly
              to Fair Price Shop (FPS) depots with real-time atomic quota deduction.
            </p>
            <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-2 text-[11px]">
              <span className="text-neutral-400 font-medium block">Selective Claims Available:</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">NFSA Scheme (PHH/AAY)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">FPS Depot ID</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/10">Monthly Rice & Wheat Quota</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: How It Works */}
      <section id="how-it-works" className="scroll-mt-28 space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Simple 3-Step Flow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How White Card Works
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
            From encryption to verification, control every byte of data you share.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[24px] glass-ios-card p-6 space-y-3 relative hover:border-white/20 hover:translate-y-[-2px] transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-bold text-sm shadow-md">
              1
            </div>
            <h3 className="text-base font-bold text-white">Link & Client Encrypt</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Add your document numbers. A unique Data Encryption Key (DEK) encrypts your data in your
              browser with AES-256-GCM before it ever leaves your machine.
            </p>
          </div>

          <div className="rounded-[24px] glass-ios-card p-6 space-y-3 relative hover:border-white/20 hover:translate-y-[-2px] transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-bold text-sm shadow-md">
              2
            </div>
            <h3 className="text-base font-bold text-white">Select What to Disclose</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Pick the audience and select only the claims needed (e.g. over 18, organ donor, voter booth).
              Set expiration from 5 minutes to 24 hours.
            </p>
          </div>

          <div className="rounded-[24px] glass-ios-card p-6 space-y-3 relative hover:border-white/20 hover:translate-y-[-2px] transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-bold text-sm shadow-md">
              3
            </div>
            <h3 className="text-base font-bold text-white">Instant Offline Proof</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              The recipient verifies your dynamic QR code offline or online. The Ed25519 signature confirms authenticity
              instantly without centralized tracking pings.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Section: Security & Architecture (Apple Bento Grid Style) */}
      <section id="features" className="scroll-mt-28 space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Enterprise Cryptography
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Security by Architecture, Not Policy
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            Engineered under the principle of zero trust. We cannot read your credentials even under subpoena.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-3 hover:border-white/20 hover:translate-y-[-2px] transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Envelope AES-256-GCM</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Every document is encrypted with a unique per-user Data Encryption Key (DEK). Plaintext
              document numbers, addresses, and DOBs never touch the database or server logs.
            </p>
          </div>

          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-3 hover:border-white/20 hover:translate-y-[-2px] transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 text-white">
              <EyeOff className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Blind Indexing (HKDF)</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Duplicate document discovery uses irreversible HMAC-SHA256 blind indexes derived from your
              normalized numbers. No plaintext searchability exists in the database.
            </p>
          </div>

          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-3 hover:border-white/20 hover:translate-y-[-2px] transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 text-white">
              <History className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Tamper-Evident Audit Chain</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Every token issue, document link, and scan writes to a cryptographically linked SHA-256
              hash chain. Tampering with any log is mathematically detectable in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Section: DPDP Act 2023 Principles */}
      <section id="security" className="scroll-mt-28 rounded-[32px] glass-ios p-6 sm:p-8 space-y-6 max-w-5xl mx-auto border border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-white">
            <FileKey2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">DPDP Act 2023 Principles</h3>
            <p className="text-xs text-neutral-400">Built from the ground up for personal privacy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-neutral-300">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:bg-white/[0.06] transition">
            <strong className="text-white block font-medium">1. Explicit Consent</strong>
            <span>Every share request presents a consent screen listing exact claims, duration, and audience.</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:bg-white/[0.06] transition">
            <strong className="text-white block font-medium">2. Purpose Limitation</strong>
            <span>Tokens specify purpose and audience. Verifiers receive only purpose-bound claims.</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:bg-white/[0.06] transition">
            <strong className="text-white block font-medium">3. Data Minimization</strong>
            <span>Blind indexes prevent duplicate discovery; single-use tokens auto-expire on access.</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:bg-white/[0.06] transition">
            <strong className="text-white block font-medium">4. Right to Erasure</strong>
            <span>Export complete decrypted wallet JSON and irreversibly erase all personal data in one click.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
