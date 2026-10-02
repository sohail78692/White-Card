"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, ShieldCheck, Lock, Zap, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <div className="relative min-h-[82vh] flex items-center justify-center py-10 px-4 overflow-hidden">
      {/* Ambient Radial Spotlight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(41,151,255,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none -z-10 blur-3xl" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,rgba(0,0,0,0)_60%)] pointer-events-none -z-10 blur-2xl" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fadeIn">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors duration-200 group py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/[0.12] border border-blue-500/30 px-3.5 py-1 text-xs font-semibold text-[#38bdf8] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#38bdf8]" />
            <span>Fast &amp; Passwordless</span>
          </span>
          <h1 className="text-3xl sm:text-[34px] font-black text-white tracking-tight leading-tight">
            Sign in to <span className="text-[#2997FF]">White Card</span>
          </h1>
          <p className="text-xs sm:text-[13.5px] text-[#94A3B8] leading-relaxed">
            Enter your email address to receive a secure 6-digit one-time cryptographic verification code.
          </p>
        </div>

        {/* Auth Form Card (Apple Luxury Frosted Glass) */}
        <div className="rounded-[24px] bg-[#070b14]/90 border border-white/[0.12] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl transition-all duration-300 hover:border-blue-500/35">
          <AuthForm />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-neutral-400 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 backdrop-blur-md">
            <Lock className="h-3 w-3 text-blue-400" />
            <span>Hardware Encrypted</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 backdrop-blur-md">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Zero Data Leakage</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 backdrop-blur-md">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Passwordless</span>
          </span>
        </div>
      </div>
    </div>
  );
}
