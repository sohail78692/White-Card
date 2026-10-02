"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, ShieldCheck, Lock, Zap, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3.5 py-1 text-xs font-semibold text-neutral-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Fast &amp; Passwordless</span>
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Sign in to <span className="text-[#60a5fa]">White Card</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Enter your email address to receive a secure 6-digit one-time verification code.
          </p>
        </div>

        {/* Auth Form Card (Apple iOS Glass) */}
        <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <AuthForm />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-neutral-400 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3 py-1">
            <Lock className="h-3 w-3 text-blue-400" />
            <span>Encrypted on Device</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3 py-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Zero Data Leakage</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3 py-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>No Passwords</span>
          </span>
        </div>
      </div>
    </div>
  );
}
