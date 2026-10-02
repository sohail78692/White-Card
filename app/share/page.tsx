"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { sound } from "@/lib/sound";
import {
  Share2,
  Shield,
  QrCode,
  Clock,
  Copy,
  Check,
  AlertCircle,
  Ban,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
  Lock,
  CarFront,
  Wheat,
  MapPin,
  CreditCard,
  UserCheck,
} from "lucide-react";

interface ShareRecord {
  jti: string;
  preset: string;
  fields: string[];
  purpose: string;
  audience: string;
  singleUse: boolean;
  status: "active" | "expired" | "revoked" | "used";
  expiresAt: string;
  createdAt: string;
}

export default function SharePage() {
  const [step, setStep] = useState<"configure" | "consent" | "active">("configure");
  const [preset, setPreset] = useState<string>("age_18_plus");
  const [purpose, setPurpose] = useState("Age Verification");
  const [audience, setAudience] = useState("general");
  const [duration, setDuration] = useState("300"); // 5 min
  const [singleUse, setSingleUse] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active generated token state
  const [activeToken, setActiveToken] = useState<{
    token: string;
    jti: string;
    shareUrl: string;
    expiresAt: string;
    claims: Record<string, any>;
    qrDataUrl: string;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [sharesHistory, setSharesHistory] = useState<ShareRecord[]>([]);

  const fetchShares = async () => {
    try {
      const res = await fetch("/api/share");
      if (res.ok) {
        const data = await res.json();
        setSharesHistory(data.shares || []);
      } else if (res.status === 401) {
        window.location.href = "/signin?redirect=/share";
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  // Countdown timer for active token
  useEffect(() => {
    if (!activeToken) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(activeToken.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining === 0) {
        fetchShares();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeToken]);

  const presetDescriptions: Record<
    string,
    { title: string; desc: string; icon: any; iconColor: string; simpleClaims: string[] }
  > = {
    age_18_plus: {
      title: "Age 18+ Check",
      desc: "Confirms you are 18 or older. Never reveals your birthdate, full name, or ID numbers.",
      icon: UserCheck,
      iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      simpleClaims: ["Age: 18 or older (Yes/No)"],
    },
    driving_auth: {
      title: "Driving Permission",
      desc: "Shows traffic officers that your license is valid and which vehicles you can drive.",
      icon: CarFront,
      iconColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      simpleClaims: ["License Valid: Yes", "Allowed Vehicles", "Organ Donor Status"],
    },
    ration_entitlement: {
      title: "Ration Shop Quota",
      desc: "Shows your monthly food grain balance and quota for Fair Price Shops.",
      icon: Wheat,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      simpleClaims: ["Ration Scheme", "Family Member Count", "Monthly Rice & Wheat Balance"],
    },
    address_only: {
      title: "Address Only",
      desc: "Confirms your current home address for delivery or residence proof.",
      icon: MapPin,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      simpleClaims: ["Verified Home Address"],
    },
    full_id: {
      title: "Basic ID Card",
      desc: "Shows your name and wallet ID with protected, masked numbers.",
      icon: CreditCard,
      iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      simpleClaims: ["Full Name", "Wallet ID", "Masked Document Badges"],
    },
  };

  const handleCreateShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset,
          purpose,
          audience,
          durationSeconds: Number(duration),
          singleUse,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Could not create share link");
        setStep("configure");
      } else {
        sound.playSuccess();
        const qrDataUrl = await QRCode.toDataURL(data.shareUrl, {
          width: 300,
          margin: 1.5,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        setActiveToken({
          token: data.token,
          jti: data.jti,
          shareUrl: data.shareUrl,
          expiresAt: data.expiresAt,
          claims: data.claims,
          qrDataUrl,
        });

        setTimeLeft(Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
        setStep("active");
        fetchShares();
      }
    } catch {
      sound.playError();
      setError("Network error while creating share link");
      setStep("configure");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (jti: string) => {
    try {
      const res = await fetch(`/api/share/${jti}/revoke`, { method: "POST" });
      if (res.ok) {
        sound.playSuccess();
        if (activeToken && activeToken.jti === jti) {
          setActiveToken(null);
          setStep("configure");
        }
        fetchShares();
      } else {
        sound.playError();
      }
    } catch {
      sound.playError();
    }
  };

  const copyUrl = async (url: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      sound.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      sound.playError();
    }
  };

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3.5 py-1 text-xs font-semibold text-neutral-300">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Secure Sharing</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Share Your <span className="text-[#60a5fa]">Proof</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
          Share only what is needed (like age 18+ or driving status) without revealing your private details or full document numbers.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-950/30 p-4 text-xs text-red-300 backdrop-blur-md">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Flow Card (Apple iOS Frosted Glass) */}
      <div className="rounded-[28px] glass-ios-card p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        {step === "configure" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                1. What do you want to prove?
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pick what the receiver needs to verify. All other information stays private.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(presetDescriptions).map(([key, item]) => {
                const Icon = item.icon;
                const isSelected = preset === key;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      sound.playTone(400, "sine", 0.05);
                      setPreset(key);
                      if (key === "age_18_plus") setPurpose("Age Verification");
                      if (key === "driving_auth") setPurpose("Traffic Check");
                      if (key === "ration_entitlement") setPurpose("Ration Collection");
                      if (key === "address_only") setPurpose("Address Verification");
                      if (key === "full_id") setPurpose("General Identification");
                    }}
                    className={`cursor-pointer rounded-[22px] p-4 sm:p-5 border transition-all duration-300 relative ${
                      isSelected
                        ? "border-blue-500/60 bg-blue-500/[0.08] shadow-[0_0_20px_rgba(59,130,246,0.15)] translate-y-[-2px]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border ${item.iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{item.title}</span>
                          <div
                            className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-white/20"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 pl-13">
                      {item.simpleClaims.map((claim) => (
                        <span
                          key={claim}
                          className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-medium text-neutral-300 border border-white/10"
                        >
                          {claim}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customization Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Reason for Sharing
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Hotel Check-in"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Who is Checking?
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#12131a] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                >
                  <option value="general">General Person / Business</option>
                  <option value="police">Traffic Police</option>
                  <option value="fps">Fair Price Shop (FPS)</option>
                  <option value="polling">Election Polling Officer</option>
                  <option value="bank">Bank / Financial Institution</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Link Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#12131a] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                >
                  <option value="60">1 Minute</option>
                  <option value="300">5 Minutes (Recommended)</option>
                  <option value="900">15 Minutes</option>
                  <option value="3600">1 Hour</option>
                  <option value="86400">24 Hours</option>
                </select>
              </div>
            </div>

            {/* Single Use Toggle */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <input
                type="checkbox"
                id="single-use-toggle"
                checked={singleUse}
                onChange={(e) => setSingleUse(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="single-use-toggle" className="text-xs text-neutral-300 cursor-pointer select-none">
                <strong className="text-white">One-time scan only:</strong> Link closes immediately after the receiver checks it once.
              </label>
            </div>

            {/* Next Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playFlip();
                  setStep("consent");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-white hover:bg-neutral-100 px-5 py-3 text-xs font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                <span>Continue to Review</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review Screen */}
        {step === "consent" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Review Before Sharing</h3>
                <span className="text-xs text-neutral-400">You are in full control of what is shown.</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Reason for sharing:</span>
                  <strong className="text-white text-sm">{purpose}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Receiver:</span>
                  <strong className="text-white text-sm uppercase">{audience}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Active for:</span>
                  <strong className="text-white text-sm">{Number(duration) / 60} minutes</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Single scan:</span>
                  <strong className="text-white text-sm">{singleUse ? "Yes (auto-expires)" : "Multiple scans allowed"}</strong>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <span className="text-neutral-400 block text-[11px] mb-2 font-medium">
                  Information that WILL be visible to the receiver:
                </span>
                <div className="flex flex-wrap gap-2">
                  {presetDescriptions[preset]?.simpleClaims.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/20"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("configure")}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] px-4 py-3 text-xs font-semibold text-neutral-300 transition"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleCreateShare}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white hover:bg-neutral-100 px-5 py-3 text-xs font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Create Secure QR Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Active QR Code & Countdown */}
        {step === "active" && activeToken && (
          <div className="space-y-6 text-center">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full glass-ios-pill px-3 py-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ready to Scan</span>
              </span>
              <h3 className="text-2xl font-bold text-white mt-2">Show This QR Code</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                The receiver can scan this code with any camera or phone to verify your proof instantly.
              </p>
            </div>

            {/* Apple-grade QR Code Frame */}
            <div className="mx-auto w-64 h-64 p-4 bg-white rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <img
                src={activeToken.qrDataUrl}
                alt="Verification QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Live Countdown Badge */}
            <div className="inline-flex items-center gap-2 rounded-full glass-ios-pill px-4 py-1.5 text-xs font-mono font-bold">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className={timeLeft < 60 ? "text-red-400" : "text-white"}>
                Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => copyUrl(activeToken.shareUrl)}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] px-5 py-2.5 text-xs font-semibold text-white transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRevoke(activeToken.jti)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-950/30 hover:bg-red-900/40 px-5 py-2.5 text-xs font-semibold text-red-400 transition"
              >
                <Ban className="h-4 w-4" />
                <span>Cancel Link</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveToken(null);
                  setStep("configure");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Create Another Share Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shares History Table */}
      <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Recent Shared Links
        </h3>

        {sharesHistory.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">No links created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400">
                  <th className="py-2.5 pr-4 font-semibold">Shared Proof</th>
                  <th className="py-2.5 pr-4 font-semibold">Reason</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 pr-4 font-semibold">Expires</th>
                  <th className="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sharesHistory.map((s) => (
                  <tr key={s.jti} className="text-neutral-300">
                    <td className="py-3 pr-4 font-semibold text-white capitalize">
                      {s.preset.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pr-4 text-neutral-400">{s.purpose}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          s.status === "active"
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                            : s.status === "revoked"
                            ? "bg-red-950/60 text-red-300 border-red-500/30"
                            : "bg-white/5 text-neutral-400 border-white/10"
                        }`}
                      >
                        {s.status === "active" ? "Active" : s.status === "revoked" ? "Cancelled" : s.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[11px] text-neutral-400">
                      {new Date(s.expiresAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 text-right">
                      {s.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(s.jti)}
                          className="rounded-full border border-red-500/20 bg-red-950/30 px-3 py-1 text-[11px] font-medium text-red-400 hover:bg-red-900/50 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
