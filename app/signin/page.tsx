"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, ShieldCheck, Lock, Zap } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[85vh] flex items-center justify-center py-10 px-4 overflow-hidden selection:bg-cyan-500/30 selection:text-white"
    >
      {/* 0. Interactive Global Cyber Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-out"
        style={{
          opacity: mousePos.active ? 1 : 0,
          background: `radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.08), transparent 75%)`,
        }}
      />

      {/* Floating Aurora Ambient Light Mesh */}
      <div className="pointer-events-none absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/[0.08] blur-[140px] animate-aurora-1" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full bg-cyan-500/[0.06] blur-[150px] animate-aurora-2" />

      {/* Subtle Cyber Grid with Radial Soft Fade */}
      <div className="pointer-events-none absolute inset-0 bg-grid-cyber opacity-[0.3] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fadeIn">
        {/* Back Link */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-all duration-200 backdrop-blur-xl"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform duration-200 text-neutral-400 group-hover:text-white" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-2.5 text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/[0.08] border border-blue-500/20 px-3 py-1 text-xs font-medium text-[#2997ff] backdrop-blur-xl">
            <KeyRound className="h-3.5 w-3.5 text-[#2997ff]" />
            <span className="tracking-wide">Fast &amp; Passwordless</span>
          </div>

          <h1 className="text-3xl sm:text-[34px] font-bold text-white tracking-tight leading-tight">
            Sign in to <span className="text-[#2997ff]">White Card</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
            Enter your email address to receive a secure 6-digit one-time cryptographic verification code.
          </p>
        </div>

        {/* Auth Form Card - Clean Frosted Luxury Glass */}
        <div className="relative rounded-3xl bg-[#0f1117]/85 border border-white/[0.1] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.16]">
          <AuthForm />
        </div>

        {/* Clean Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-neutral-400 pt-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-white/20 px-3 py-1.5 transition-colors">
            <Lock className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-neutral-300">Hardware Encrypted</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-white/20 px-3 py-1.5 transition-colors">
            <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-neutral-300">Zero Data Leakage</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-white/20 px-3 py-1.5 transition-colors">
            <Zap className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-neutral-300">Passwordless</span>
          </div>
        </div>
      </div>
    </div>
  );
}
