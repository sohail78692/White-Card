"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { sound } from "@/lib/sound";
import { WalletCard } from "@/components/WalletCard";
import { AddDocumentModal } from "@/components/AddDocumentModal";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
import {
  FolderLock,
  Share2,
  Shield,
  ShieldCheck,
  Phone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogOut,
  IdCard,
  Mail,
} from "lucide-react";

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({ linkedDocs: 0, verificationsToday: 0, auditEntries: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  const [emergencyContact, setEmergencyContact] = useState("+91 98765 43210");
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactInput, setContactInput] = useState(emergencyContact);

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
      const saved = localStorage.getItem("wc_emergency_contact");
      if (saved) {
        setEmergencyContact(saved);
        setContactInput(saved);
      }
    } catch {}
    loadProfile();
  }, []);

  const handleUpdateEmergencyContact = (contact: string) => {
    setEmergencyContact(contact);
    setContactInput(contact);
    try {
      localStorage.setItem("wc_emergency_contact", contact);
    } catch {}
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
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10 pt-1 sm:pt-2 pb-8 max-w-5xl mx-auto">
      {/* 3D Wide Multi-Card Wallet Display Section */}
      <section className="text-center space-y-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold text-neutral-300 bg-white/[0.04] border border-white/10">
            <IdCard className="h-3.5 w-3.5 text-sky-400" />
            <span>Digital Sovereign Card</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            White <span className="text-sky-400">Card</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Your cryptographic digital credential card. Tap to flip in 3D and verify offline.
          </p>
        </div>

        <WalletCard
          walletId={user?.walletId || "WC-0000-0000-0000"}
          userName={user?.name || user?.email || "Personal Wallet Holder"}
          linkedDocsCount={documents.length || stats.linkedDocs}
          emergencyContact={emergencyContact}
          documents={documents}
          onEmergencyContactChange={handleUpdateEmergencyContact}
          onAddDocument={() => setIsAddingDoc(true)}
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
            <div className="text-2xl font-bold text-white tracking-tight">{stats.linkedDocs}</div>
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
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.verificationsToday}</div>
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

        {/* Emergency Contact */}
        <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Emergency Phone Number</h3>
              <span className="text-[11px] text-neutral-400">Shown on card back</span>
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Helps traffic police, hospitals, and emergency responders quickly contact your loved ones.
          </p>

          {isEditingContact ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                placeholder="+91 98765 43210"
              />
              <button
                type="button"
                onClick={handleSaveContact}
                className="rounded-full bg-white text-black px-4 py-2 text-xs font-bold hover:bg-neutral-200 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingContact(false)}
                className="rounded-full bg-white/10 text-neutral-300 px-3 py-2 text-xs font-medium hover:bg-white/15 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3.5 border border-white/5">
              <span className="text-xs font-mono font-bold text-white">{emergencyContact}</span>
              <button
                type="button"
                onClick={() => {
                  setContactInput(emergencyContact);
                  setIsEditingContact(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Change
              </button>
            </div>
          )}
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
