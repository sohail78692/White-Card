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
  Eye,
  FileCheck2,
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

  const presetDescriptions: Record<string, { title: string; desc: string; disclosed: string[] }> = {
    age_18_plus: {
      title: "Age 18+ Verification",
      desc: "Confirms whether you are over 18 without revealing your DOB, name, address, or document numbers.",
      disclosed: ["over18: boolean"],
    },
    driving_auth: {
      title: "Driving Authorization",
      desc: "Proves legal driving eligibility and vehicle categories for traffic inspectors.",
      disclosed: ["drivingLicenseValid: boolean", "vehicleClasses: string[]", "organDonor: boolean"],
    },
    ration_entitlement: {
      title: "Fair Price Shop (FPS) Ration",
      desc: "Discloses food grain entitlement quota and remaining monthly balance.",
      disclosed: ["scheme", "familyMembersCount", "remainingRiceKg", "remainingWheatKg"],
    },
    address_only: {
      title: "Address Verification",
      desc: "Discloses current address for deliveries, residency proof, or bank verification.",
      disclosed: ["address"],
    },
    full_id: {
      title: "Full Identity Overview",
      desc: "Discloses holder name, wallet ID, and masked list of linked government credentials.",
      disclosed: ["name", "walletId", "linkedDocuments (masked)"],
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
        setError(data.error || "Failed to create share token");
        setStep("configure");
      } else {
        sound.playSuccess();
        const qrDataUrl = await QRCode.toDataURL(data.shareUrl, {
          width: 300,
          margin: 1.5,
          color: {
            dark: "#020617",
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
      setError("Network error while generating share");
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
    <div className="space-y-8 py-2">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Share2 className="h-6 w-6 text-indigo-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Selective Disclosure Sharing
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Generate cryptographic Ed25519 tokens disclosing only minimal required claims with explicit consent.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Flow Card */}
      <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
        {step === "configure" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                1. Select Disclosure Preset
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose the minimal set of data necessary for your verifier.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {Object.entries(presetDescriptions).map(([key, item]) => (
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
                  className={`cursor-pointer rounded-xl p-4 border transition ${
                    preset === key
                      ? "border-indigo-500 bg-indigo-950/40 shadow-glow"
                      : "border-white/5 bg-slate-900/60 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-white text-sm">{item.title}</span>
                    <input
                      type="radio"
                      name="preset"
                      checked={preset === key}
                      onChange={() => setPreset(key)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {item.disclosed.map((field) => (
                      <span
                        key={field}
                        className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-indigo-300 border border-white/5"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Authorized Purpose
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Hotel Check-in"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="general">General / Public</option>
                  <option value="police">Traffic Police</option>
                  <option value="fps">Fair Price Shop (FPS)</option>
                  <option value="polling">Polling Booth Officer</option>
                  <option value="bank">Bank / Financial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Token Expiration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="60">1 Minute</option>
                  <option value="300">5 Minutes (Recommended)</option>
                  <option value="900">15 Minutes</option>
                  <option value="3600">1 Hour</option>
                  <option value="86400">24 Hours</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="single-use-toggle"
                checked={singleUse}
                onChange={(e) => setSingleUse(e.target.checked)}
                className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="single-use-toggle" className="text-xs text-slate-300 cursor-pointer">
                <strong>Single-use token:</strong> Auto-expire immediately after first successful verification.
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playFlip();
                  setStep("consent");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition"
              >
                <span>Review DPDP Consent Screen</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: DPDP Explicit Consent Screen */}
        {step === "consent" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-400">
              <Shield className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Explicit DPDP Consent Confirmation</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Under the Digital Personal Data Protection (DPDP) Act 2023, you retain complete ownership
              of your identity data. Review the exact claims that will be disclosed by this cryptographic token:
            </p>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Authorized Purpose:</span>
                  <strong className="text-white">{purpose}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Intended Verifier / Audience:</span>
                  <strong className="text-white uppercase">{audience}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Lifespan:</span>
                  <strong className="text-white">{Number(duration) / 60} minutes</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Single-use:</span>
                  <strong className="text-white">{singleUse ? "Yes (Revokes after 1 scan)" : "No"}</strong>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <span className="text-slate-400 block text-[11px] mb-2 font-medium">
                  Fields Disclosed to Verifier:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetDescriptions[preset]?.disclosed.map((f) => (
                    <span
                      key={f}
                      className="rounded-lg bg-indigo-900/60 px-2.5 py-1 text-xs font-mono text-indigo-200 border border-indigo-500/30"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("configure")}
                className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleCreateShare}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>I Consent & Sign Token</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Active Token Display with QR and Countdown */}
        {step === "active" && activeToken && (
          <div className="space-y-6 text-center">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Active Signed Token</span>
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Ready to Verify</h3>
            </div>

            {/* QR Code Container */}
            <div className="mx-auto w-64 h-64 p-3 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
              <img
                src={activeToken.qrDataUrl}
                alt="Verification QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 text-sm font-mono font-semibold">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className={timeLeft < 60 ? "text-red-400" : "text-slate-200"}>
                Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => copyUrl(activeToken.shareUrl)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied URL" : "Copy Share Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRevoke(activeToken.jti)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-950/40 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-900/50 transition"
              >
                <Ban className="h-4 w-4" />
                <span>Revoke Immediately</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveToken(null);
                  setStep("configure");
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                + Create Another Share Token
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shares History Table */}
      <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Share Token History & Revocation
        </h3>

        {sharesHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No shares created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 pr-4 font-semibold">Preset</th>
                  <th className="py-2.5 pr-4 font-semibold">Purpose</th>
                  <th className="py-2.5 pr-4 font-semibold">Audience</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 pr-4 font-semibold">Expires</th>
                  <th className="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sharesHistory.map((s) => (
                  <tr key={s.jti} className="text-slate-300">
                    <td className="py-3 pr-4 font-medium capitalize text-white">
                      {s.preset.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pr-4">{s.purpose}</td>
                    <td className="py-3 pr-4 uppercase text-[11px] text-slate-400">{s.audience}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          s.status === "active"
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                            : s.status === "revoked"
                            ? "bg-red-950/60 text-red-300 border-red-500/30"
                            : "bg-slate-800 text-slate-400 border-white/5"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[11px] text-slate-400">
                      {new Date(s.expiresAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 text-right">
                      {s.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(s.jti)}
                          className="rounded-lg border border-red-500/20 bg-red-950/30 px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-900/40 transition"
                        >
                          Revoke
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
