"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, ShieldCheck, Lock, Zap } from "lucide-react";
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
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Access Your Wallet
            </h1>
            <p className="text-sm text-neutral-400 mt-1.5">
              Sign in using a passwordless 6-digit email OTP or biometric WebAuthn passkey.
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 sm:p-6">
          <AuthForm />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-500 pt-2">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Client Encrypted</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero PII Leakage</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span>Passwordless</span>
          </div>
        </div>
      </div>
    </div>
  );
}
