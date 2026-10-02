"use client";

import React, { useState } from "react";
import { sound } from "@/lib/sound";
import { Mail, KeyRound, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("wc_last_email");
      if (saved) {
        setEmail((prev) => prev || saved);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Failed to send code");
      } else {
        sound.playSuccess();
        setSuccessMsg("Verification code sent! Please check your inbox.");
        setStep("code");
      }
    } catch {
      sound.playError();
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Verification failed");
      } else {
        sound.playSuccess();
        try {
          localStorage.setItem("wc_last_email", email.trim());
        } catch {}
        if (onSuccess) {
          onSuccess();
        } else {
          const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const redirectUrl = params?.get("redirect") || "/wallet";
          window.location.href = redirectUrl;
        }
      }
    } catch {
      sound.playError();
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Error & Success Alerts */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Email OTP Flow */}
      <div>
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-400">
                We&apos;ll send a 6-digit one-time code to authenticate your wallet.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-neutral-200 text-black px-4 py-2.5 text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Send Verification Code</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  6-Digit Security Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-[11px] text-neutral-300 hover:text-white underline cursor-pointer"
                >
                  Change Email
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-xl border border-white/10 bg-black/80 pl-10 pr-4 py-2.5 text-center text-lg font-mono tracking-widest text-white placeholder-neutral-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-400">
                Sent to <strong className="text-white">{email}</strong>. Valid for 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-neutral-200 text-black px-4 py-2.5 text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Verify & Open Wallet</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
