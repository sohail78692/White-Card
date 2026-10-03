"use client";

import React, { useState, useRef, useEffect } from "react";
import { sound } from "@/lib/sound";
import { Mail, KeyRound, ArrowRight, Loader2, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wc_last_email");
      if (saved) {
        setEmail((prev) => prev || saved);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus first digit when switching to "code" step
  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      sound.playError();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Failed to send code");
      } else {
        sound.playSuccess();
        setSuccessMsg("Verification code dispatched to your inbox.");
        setStep("code");
        setDigits(["", "", "", "", "", ""]);
        setResendCooldown(30);
      }
    } catch {
      sound.playError();
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    sound.playPop();
    const lastChar = cleaned[cleaned.length - 1];
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are filled
    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    sound.playPop();
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
      verifyCode(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join("");
    if (!code || code.length !== 6) {
      setError("Please enter the complete 6-digit security code.");
      sound.playError();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Invalid or expired code. Please try again.");
      } else {
        sound.playSuccess();
        try {
          localStorage.setItem("wc_last_email", email.trim().toLowerCase());
        } catch {
          // Ignore
        }
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
      setError("Verification service unreachable. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Dynamic Alerts with GPU Fade In */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-950/40 p-3 text-xs text-red-300 shadow-[0_4px_16px_rgba(225,29,72,0.15)] animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-[#FF3B5C] shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-950/40 p-3 text-xs text-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.15)] animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* Step 1: Email Address Flow */}
      {step === "email" ? (
        <form onSubmit={handleSendOtp} className="space-y-4 animate-fadeIn">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Work or Personal Email
            </label>

            <div className="relative flex items-center group">
              <Mail className="absolute left-3.5 h-4 w-4 text-neutral-400 group-focus-within:text-[#2997ff] transition-colors duration-200 pointer-events-none" />
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-9 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#2997ff] focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-[#2997ff] transition-all duration-200"
              />

              {email && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    sound.playPop();
                  }}
                  className="absolute right-3 p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
                  title="Clear email"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="mt-1 text-[11.5px] text-neutral-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>We never store plain credentials. One-time code valid for 5 minutes.</span>
            </p>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || !email}
              className="group relative w-full overflow-hidden flex items-center justify-center gap-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 px-4 text-sm font-semibold shadow-[0_4px_16px_rgba(0,113,227,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {/* Subtle Elegant Light Sweep on Hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none transition-transform" />

              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span>Send Verification Code</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Step 2: 6-Digit OTP Flow with Individual Inputs */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyCode();
          }}
          className="space-y-5 animate-fadeIn"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-300">
                Security Verification Code
              </label>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setStep("email");
                }}
                className="text-xs text-[#2997ff] hover:text-blue-300 font-medium transition cursor-pointer"
              >
                Change Email
              </button>
            </div>

            {/* 6 Individual Digit Boxes */}
            <div className="flex items-center justify-between gap-2 sm:gap-2.5">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className={`w-11 sm:w-12 h-13 sm:h-14 rounded-xl text-center font-mono text-xl sm:text-2xl font-bold transition-all duration-200 border ${
                    digit
                      ? "border-[#2997ff] bg-blue-500/[0.12] text-white shadow-[0_0_12px_rgba(41,151,255,0.35)]"
                      : "border-white/10 bg-white/[0.04] text-white hover:border-white/25"
                  } focus:border-[#2997ff] focus:bg-blue-500/[0.15] focus:outline-none focus:ring-1 focus:ring-[#2997ff]`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11.5px] text-neutral-400">
              <span className="truncate pr-2">
                Sent to <strong className="text-white font-medium">{email}</strong>
              </span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleSendOtp()}
                className="text-[#2997ff] hover:text-blue-300 font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}</span>
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || digits.some((d) => !d)}
              className="group relative w-full overflow-hidden flex items-center justify-center gap-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 px-4 text-sm font-semibold shadow-[0_4px_16px_rgba(0,113,227,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none transition-transform" />

              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span>Verify &amp; Open Wallet</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
