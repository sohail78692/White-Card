"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { sound } from "@/lib/sound";
import { WalletCard } from "@/components/WalletCard";
import { AddDocumentModal } from "@/components/AddDocumentModal";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
import { DocumentType } from "@/lib/validators/documents";
import {
  FolderLock,
  Share2,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogOut,
  IdCard,
  Mail,
  Plus,
} from "lucide-react";

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({ linkedDocs: 0, verificationsToday: 0, auditEntries: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [addModalType, setAddModalType] = useState<DocumentType>("DRIVING_LICENSE");

  const [privacyShield, setPrivacyShield] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [meRes, sessRes, vaultRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/auth/sessions"),
        fetch("/api/vault"),
      ]);

      if (meRes.ok) {
        const d = await meRes.json();
        setUser(d.user);
        if (d.user?.email) {
          try {
            localStorage.setItem("wc_last_email", d.user.email);
          } catch {}
        }
        setStats(d.stats || { linkedDocs: 0, verificationsToday: 0, auditEntries: 0 });
      } else {
        window.location.href = "/signin?redirect=/wallet";
        return;
      }

      if (sessRes.ok) {
        const s = await sessRes.json();
        setSessions(s.sessions || []);
      }

      if (vaultRes && vaultRes.ok) {
        const v = await vaultRes.json();
        setDocuments(v.documents || []);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wc_privacy_shield");
      if (saved !== null) {
        setPrivacyShield(saved === "true");
      }
    } catch {}
    loadProfile();
  }, []);

  const togglePrivacyShield = () => {
    setPrivacyShield((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("wc_privacy_shield", String(next));
      } catch {}
      sound.playPop();
      return next;
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10 pt-1 sm:pt-2 pb-8 max-w-5xl mx-auto">
      {/* 3D Wide Multi-Card Wallet Display Section */}
      <section className="text-center space-y-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-medium text-neutral-300 bg-white/[0.04] border border-white/10">
            <FolderLock className="h-3 w-3 text-sky-400" />
            <span>Encrypted Credential Holder</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            White <span className="text-sky-400">Card</span>
          </h1>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Your encrypted personal identity holder. Tap the folder to open, search, and inspect your sovereign cards.
          </p>
        </div>

        <WalletCard
          walletId={user?.walletId || "WC-0000-0000-0000"}
          userName={user?.name || user?.email || "Personal Wallet Holder"}
          linkedDocsCount={documents.length || stats.linkedDocs}
          privacyShield={privacyShield}
          documents={documents}
          onAddDocument={() => {
            setAddModalType("DRIVING_LICENSE");
            setIsAddingDoc(true);
          }}
          onOpenDocument={(id) => setSelectedDocId(id)}
        />
      </section>


      {/* Live Wallet Counters Grid (iOS Frosted Glass Cards with Hover Animation) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/vault"
          className="rounded-[24px] glass-ios-card p-5 hover:translate-y-[-2px] hover:border-white/25 transition-all duration-300 flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 font-medium">Saved Documents</span>
            <div className="text-2xl font-bold text-white tracking-tight">
              {documents.length || stats.linkedDocs || 0}
            </div>
            <span className="text-[11px] text-blue-400 group-hover:underline flex items-center gap-1">
              View vault <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-sm">
            <FolderLock className="h-5 w-5" />
          </div>
        </Link>

        <Link
          href="/share"
          className="rounded-[24px] glass-ios-card p-5 hover:translate-y-[-2px] hover:border-white/25 transition-all duration-300 flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 font-medium">Shares Created</span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {stats.sharesCreated ?? stats.verificationsToday ?? 0}
            </div>
            <span className="text-[11px] text-emerald-400 group-hover:underline flex items-center gap-1">
              Create share <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
            <Share2 className="h-5 w-5" />
          </div>
        </Link>

        <Link
          href="/privacy"
          className="rounded-[24px] glass-ios-card p-5 hover:translate-y-[-2px] hover:border-white/25 transition-all duration-300 flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs text-neutral-400 font-medium">Security Activity</span>
            <div className="text-2xl font-bold text-purple-400 tracking-tight">{stats.auditEntries}</div>
            <span className="text-[11px] text-purple-400 group-hover:underline flex items-center gap-1">
              Check history <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
        </Link>
      </section>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-950/30 p-4 text-xs text-red-300 backdrop-blur-md">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Security & Settings Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Authentication & Security */}
        <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Passwordless Authentication</h3>
                <span className="text-[11px] text-neutral-400">Cryptographic Email OTP</span>
              </div>
            </div>
            <span className="rounded-full glass-ios-pill px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Active</span>
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Your wallet is protected by hardware-random 6-digit one-time cryptographic tokens sent directly to your registered email address. No passwords to leak or steal.
          </p>

          <div className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Mail className="h-4 w-4 text-emerald-400" />
            <span>Secured via {user?.email || "Registered Email"}</span>
          </div>
        </div>

        {/* Privacy Shield / Anti-Shoulder Surfing */}
        <div
          onClick={togglePrivacyShield}
          className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/20 transition-all duration-300 cursor-pointer group/shield select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                  privacyShield
                    ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    : "bg-white/[0.06] border border-white/10 text-neutral-400"
                }`}
              >
                {privacyShield ? (
                  <EyeOff className="h-5 w-5 transition-transform group-hover/shield:scale-110" />
                ) : (
                  <Eye className="h-5 w-5 transition-transform group-hover/shield:scale-110" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Privacy Shield
                  {privacyShield && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </h3>
                <span className="text-[11px] text-neutral-400">Anti-Shoulder Surfing Mode</span>
              </div>
            </div>

            {/* iOS Style Glass Toggle Switch */}
            <div
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 border flex items-center ${
                privacyShield
                  ? "bg-indigo-600 border-indigo-400/50 justify-end shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                  : "bg-white/10 border-white/10 justify-start"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transition-transform" />
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Obscures and masks document numbers, cardholders, and personal identifiers to protect against prying eyes in public spaces.
          </p>

          <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3.5 border border-white/5 group-hover/shield:border-white/10 transition-colors">
            <div className="flex items-center gap-2.5">
              <Shield className={`h-4 w-4 ${privacyShield ? "text-indigo-400" : "text-neutral-500"}`} />
              <div className="text-xs">
                <span className="text-neutral-400 mr-2 text-[11px]">Display Mode:</span>
                <span className={`font-mono font-bold ${privacyShield ? "text-indigo-300" : "text-white"}`}>
                  {privacyShield ? "•••• •••• ••••" : "DL-0420240019283"}
                </span>
              </div>
            </div>

            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                privacyShield
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                  : "bg-white/5 border-white/10 text-neutral-400"
              }`}
            >
              {privacyShield ? "Shielded" : "Tap to Shield"}
            </span>
          </div>
        </div>
      </section>

      {/* Active Signed-In Devices */}
      <section className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shadow-sm">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Signed-in Devices</h3>
            <span className="text-[11px] text-neutral-400">Where your wallet is currently open</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 text-xs hover:bg-white/[0.05] transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate max-w-xs">{sess.ua || "Web Browser"}</span>
                  {sess.isCurrent && (
                    <span className="rounded-full glass-ios-pill px-2.5 py-0.5 text-[10px] text-emerald-400 font-semibold">
                      This Device
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400">
                  IP: {sess.ip} • Started {new Date(sess.createdAt).toLocaleDateString()}
                </span>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(sess.id)}
                  className="rounded-full border border-red-500/20 bg-red-950/30 px-3.5 py-1 text-xs font-medium text-red-400 hover:bg-red-900/50 transition flex items-center gap-1.5"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Log out</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Add Document Modal */}
      {isAddingDoc && (
        <AddDocumentModal
          onClose={() => setIsAddingDoc(false)}
          onAdded={() => {
            setIsAddingDoc(false);
            loadProfile();
          }}
          initialType={addModalType}
        />
      )}

      {/* Document Detail Modal */}
      {selectedDocId && (
        <DocumentDetailModal
          docId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
          onDeleted={() => {
            setSelectedDocId(null);
            loadProfile();
          }}
        />
      )}
    </div>
  );
}
