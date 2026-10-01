"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { sound } from "@/lib/sound";
import { WalletCard } from "@/components/WalletCard";
import { startRegistration } from "@simplewebauthn/browser";
import {
  CreditCard,
  FolderLock,
  Share2,
  Shield,
  KeyRound,
  Fingerprint,
  Phone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  LogOut,
} from "lucide-react";

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({ linkedDocs: 0, verificationsToday: 0, auditEntries: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [emergencyContact, setEmergencyContact] = useState("+91 98765 43210");
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactInput, setContactInput] = useState(emergencyContact);

  const [loading, setLoading] = useState(true);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyMsg, setPasskeyMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [meRes, sessRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/auth/sessions"),
      ]);

      if (meRes.ok) {
        const d = await meRes.json();
        setUser(d.user);
        setStats(d.stats || { linkedDocs: 0, verificationsToday: 0, auditEntries: 0 });
      } else {
        window.location.href = "/#auth";
      }

      if (sessRes.ok) {
        const s = await sessRes.json();
        setSessions(s.sessions || []);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyMsg(null);
    setError(null);

    try {
      // 1. Get options
      const optRes = await fetch("/api/auth/passkey/register-options", { method: "POST" });
      if (!optRes.ok) {
        throw new Error("Failed to get registration options");
      }
      const options = await optRes.json();

      // 2. Invoke browser WebAuthn
      const regResponse = await startRegistration(options);

      // 3. Verify on server
      const verifyRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResponse),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        sound.playError();
        setError(verifyData.error || "Passkey registration failed");
      } else {
        sound.playSuccess();
        setPasskeyMsg("Biometric passkey registered successfully! You can now use it to sign in.");
      }
    } catch (err: unknown) {
      sound.playError();
      const msg = err instanceof Error ? err.message : "Passkey registration cancelled";
      setError(msg);
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}/revoke`, { method: "POST" });
      if (res.ok) {
        sound.playSuccess();
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        sound.playError();
      }
    } catch {
      sound.playError();
    }
  };

  const handleSaveContact = () => {
    setEmergencyContact(contactInput);
    setIsEditingContact(false);
    sound.playSuccess();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {/* 3D Wallet Card Display Section */}
      <section className="text-center space-y-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-indigo-400">
            Official Credential Holder
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Personal Wallet
          </h1>
        </div>

        <WalletCard
          walletId={user?.walletId || "WC-0000-0000-0000"}
          userName={user?.name || user?.email || "Personal Wallet Holder"}
          linkedDocsCount={stats.linkedDocs}
          emergencyContact={emergencyContact}
        />
      </section>

      {/* Live Wallet Counters Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/vault"
          className="rounded-2xl glass-panel p-5 border border-white/10 hover:border-indigo-500/30 transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Linked Credentials</span>
            <strong className="text-2xl font-bold text-white">{stats.linkedDocs}</strong>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-500/20">
            <FolderLock className="h-5 w-5" />
          </div>
        </Link>

        <Link
          href="/verify"
          className="rounded-2xl glass-panel p-5 border border-white/10 hover:border-emerald-500/30 transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Verifications Today</span>
            <strong className="text-2xl font-bold text-emerald-400">{stats.verificationsToday}</strong>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
            <Share2 className="h-5 w-5" />
          </div>
        </Link>

        <Link
          href="/privacy"
          className="rounded-2xl glass-panel p-5 border border-white/10 hover:border-cyan-500/30 transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Audit Hash Blocks</span>
            <strong className="text-2xl font-bold text-cyan-400">{stats.auditEntries}</strong>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">
            <Shield className="h-5 w-5" />
          </div>
        </Link>
      </section>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {passkeyMsg && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{passkeyMsg}</span>
        </div>
      )}

      {/* Security & Settings Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passkey Management */}
        <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Biometric Passkeys</h3>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              WebAuthn
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Register your Touch ID, Face ID, or hardware security key to sign into your wallet without waiting for email OTPs.
          </p>

          <button
            type="button"
            onClick={handleRegisterPasskey}
            disabled={passkeyLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {passkeyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Register This Device as a Passkey</span>
          </button>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Emergency Contact (Card Back)</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Displayed on the reverse of your 3D card for first responders and authorities in emergency situations.
          </p>

          {isEditingContact ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white"
                placeholder="+91 98765 43210"
              />
              <button
                type="button"
                onClick={handleSaveContact}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingContact(false)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3 border border-white/5">
              <span className="text-xs font-mono font-bold text-white">{emergencyContact}</span>
              <button
                type="button"
                onClick={() => {
                  setContactInput(emergencyContact);
                  setIsEditingContact(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Active Sessions */}
      <section className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Laptop className="h-5 w-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">Active Authorized Sessions</h3>
        </div>

        <div className="space-y-2">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3.5 border border-white/5 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate max-w-xs">{sess.ua || "Browser Session"}</span>
                  {sess.isCurrent && (
                    <span className="rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/30">
                      Current Device
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  IP: {sess.ip} • Started {new Date(sess.createdAt).toLocaleDateString()}
                </span>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(sess.id)}
                  className="rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/40 transition"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
