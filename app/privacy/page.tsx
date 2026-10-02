"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import {
  ShieldCheck,
  History,
  FileCheck2,
  Download,
  Trash2,
  Ban,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

export default function PrivacyCenterPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "consents" | "blocklist" | "data">("audit");
  const [logs, setLogs] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [blocklist, setBlocklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Audit verify state
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainStatus, setChainStatus] = useState<{
    intact?: boolean;
    totalEntries?: number;
    firstBrokenIndex?: number;
    reason?: string;
  } | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, consentsRes, blockRes] = await Promise.all([
        fetch(`/api/audit/logs?action=${actionFilter}`),
        fetch("/api/privacy/consents"),
        fetch("/api/privacy/blocklist"),
      ]);

      if (logsRes.status === 401 || consentsRes.status === 401 || blockRes.status === 401) {
        window.location.href = "/signin?redirect=/privacy";
        return;
      }

      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d.logs || []);
      }
      if (consentsRes.ok) {
        const c = await consentsRes.json();
        setConsents(c.consents || []);
      }
      if (blockRes.ok) {
        const b = await blockRes.json();
        setBlocklist(b.blocklist || []);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [actionFilter]);

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    setChainStatus(null);
    try {
      const res = await fetch("/api/audit/verify");
      const data = await res.json();
      setChainStatus(data);
      if (data.intact) {
        sound.playSuccess();
      } else {
        sound.playError();
      }
    } catch {
      sound.playError();
      setChainStatus({ intact: false, reason: "Network error while checking records" });
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleExportAuditLogs = () => {
    sound.playSuccess();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `whitecard-activity-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your wallet? All documents and records will be deleted forever."
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/privacy/erase", { method: "POST" });
      if (res.ok) {
        sound.playSuccess();
        alert("Your account and all personal data have been completely deleted.");
        window.location.href = "/";
      } else {
        sound.playError();
        alert("Failed to delete account. Please try again.");
      }
    } catch {
      sound.playError();
      alert("Network error during account deletion.");
    }
  };

  return (
    <div className="space-y-8 py-2 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3.5 py-1 text-xs font-semibold text-neutral-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Data &amp; Privacy</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy &amp; <span className="text-[#60a5fa]">Security</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Check security logs, manage permissions, or download and delete your account anytime.
          </p>
        </div>

        {/* Navigation Tabs (Apple iOS Glass Pill Selector) */}
        <div className="flex rounded-full bg-white/[0.05] p-1 border border-white/10 overflow-x-auto no-scrollbar shrink-0 backdrop-blur-md">
          {[
            { id: "audit", label: "Security Activity", icon: History },
            { id: "consents", label: "Permissions", icon: FileCheck2 },
            { id: "blocklist", label: "Blocked Organizations", icon: Ban },
            { id: "data", label: "Download & Erase", icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playTone(440, "sine", 0.04);
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Audit Activity */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* Tamper Verification Banner */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-white/20 transition-all duration-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Tamper-Proof Activity History</h3>
              </div>
              <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
                Every action in your wallet is permanently sealed in an unchangeable chain. You can check anytime to confirm that no records were altered or deleted.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleVerifyChain}
                disabled={verifyingChain}
                className="flex items-center gap-2 rounded-full bg-white hover:bg-neutral-100 px-5 py-2.5 text-xs font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
              >
                {verifyingChain ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Check Log Integrity</span>
              </button>

              <button
                type="button"
                onClick={handleExportAuditLogs}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-4 py-2.5 text-xs font-semibold text-neutral-200 transition"
              >
                <Download className="h-4 w-4 text-neutral-400" />
                <span className="hidden sm:inline">Export Log</span>
              </button>
            </div>
          </div>

          {/* Verification Result Feedback */}
          {chainStatus && (
            <div
              className={`rounded-[24px] p-5 border flex items-start gap-3 text-xs backdrop-blur-md ${
                chainStatus.intact
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/30 border-red-500/30 text-red-300"
              }`}
            >
              {chainStatus.intact ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block font-bold text-sm">
                  {chainStatus.intact
                    ? "All Security Records Verified Authentic!"
                    : "Discrepancy Detected in Security Records!"}
                </strong>
                <span className="text-xs opacity-90">
                  {chainStatus.intact
                    ? `All ${chainStatus.totalEntries} sequential entries were verified without any missing or altered records.`
                    : `Issue at item ${chainStatus.firstBrokenIndex}: ${chainStatus.reason}`}
                </span>
              </div>
            </div>
          )}

          {/* Action Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-neutral-400 mr-1 text-[11px] font-semibold">Filter:</span>
            {[
              { id: "all", label: "All Actions" },
              { id: "verify", label: "Scans / Checks" },
              { id: "link_document", label: "Saved Docs" },
              { id: "create_share", label: "Created Shares" },
              { id: "revoke_share", label: "Cancelled Shares" },
              { id: "ration_dispense", label: "Ration Grain Dispenses" },
              { id: "polling_checkin", label: "Election Polling Checkins" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActionFilter(f.id)}
                className={`rounded-full px-3 py-1 font-medium transition shrink-0 ${
                  actionFilter === f.id
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "bg-white/[0.04] text-neutral-400 border border-white/10 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Audit Logs Table (Apple iOS Frosted Glass) */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-neutral-500 py-8 text-center">No activity matches this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400">
                      <th className="py-2.5 pr-3 font-semibold">#</th>
                      <th className="py-2.5 pr-4 font-semibold">Time</th>
                      <th className="py-2.5 pr-4 font-semibold">Who Checked</th>
                      <th className="py-2.5 pr-4 font-semibold">Action</th>
                      <th className="py-2.5 pr-4 font-semibold">Fields Shown</th>
                      <th className="py-2.5 pr-4 font-semibold">Status</th>
                      <th className="py-2.5 font-mono text-[11px] text-right">Receipt Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                      <tr key={log.seq} className="text-neutral-300 hover:bg-white/[0.02] transition">
                        <td className="py-3 pr-3 font-mono font-bold text-blue-400">{log.seq}</td>
                        <td className="py-3 pr-4 text-[11px] text-neutral-400">
                          {new Date(log.ts).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 font-medium text-white">{log.actor}</td>
                        <td className="py-3 pr-4 capitalize text-neutral-300">
                          {log.action.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {log.fields && log.fields.length > 0 ? (
                              log.fields.map((f: string) => (
                                <span
                                  key={f}
                                  className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-neutral-300 border border-white/10"
                                >
                                  {f}
                                </span>
                              ))
                            ) : (
                              <span className="text-neutral-500">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                              log.result === "success"
                                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                                : log.result === "revoked"
                                ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
                                : "bg-red-950/60 text-red-300 border-red-500/30"
                            }`}
                          >
                            {log.result}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-[11px] text-neutral-500">
                          <span title={log.hash}>{log.shortHash}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Consents History */}
      {activeTab === "consents" && (
        <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Sharing Permissions History
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Full record of permissions granted by you whenever you created a share link.
            </p>
          </div>

          {consents.length === 0 ? (
            <p className="text-xs text-neutral-500 py-8 text-center">No permissions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400">
                    <th className="py-2.5 pr-4 font-semibold">Granted At</th>
                    <th className="py-2.5 pr-4 font-semibold">Reason</th>
                    <th className="py-2.5 pr-4 font-semibold">Receiver</th>
                    <th className="py-2.5 pr-4 font-semibold">Duration</th>
                    <th className="py-2.5 font-semibold">Shared Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {consents.map((c) => (
                    <tr key={c.id} className="text-neutral-300">
                      <td className="py-3 pr-4 text-[11px] text-neutral-400">
                        {new Date(c.at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 font-medium text-white">{c.purpose}</td>
                      <td className="py-3 pr-4 uppercase text-[11px] text-blue-400">{c.audience}</td>
                      <td className="py-3 pr-4">{c.duration / 60} minutes</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.fields?.map((f: string) => (
                            <span
                              key={f}
                              className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-neutral-300 border border-white/10"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Verifier Blocklist */}
      {activeTab === "blocklist" && (
        <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Blocked Organizations
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Blocked organizations cannot verify your documents even if someone provides them with a link.
            </p>
          </div>

          {blocklist.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 p-8 text-center text-xs text-neutral-500">
              No organizations currently blocked.
            </div>
          ) : (
            <div className="space-y-2">
              {blocklist.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-4 border border-white/5 text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-white">{b.verifierName}</h4>
                    <span className="text-[10px] text-neutral-400 uppercase">{b.verifierType}</span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/privacy/blocklist", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ verifierId: b.verifierId, action: "unblock" }),
                      });
                      loadData();
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.1] transition"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Data Export & Erasure */}
      {activeTab === "data" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Data */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 space-y-4 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Download Your Data</h3>
                <span className="text-[11px] text-neutral-400">Your Complete Wallet File</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Export your entire encrypted personal wallet in one file. Contains your document numbers, share history, and profile attributes.
            </p>

            <a
              href="/api/vault/export"
              download
              className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-neutral-100 px-5 py-2.5 text-xs font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <Download className="h-4 w-4" />
              <span>Download Wallet Data (.JSON)</span>
            </a>
          </div>

          {/* Delete Account */}
          <div className="rounded-[28px] glass-ios-card p-6 sm:p-7 border border-red-500/20 bg-red-950/10 space-y-4 hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Account &amp; Wipe Data</h3>
                <span className="text-[11px] text-red-400">Permanent &amp; Irreversible</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Permanently erase your account, all linked documents, security keys, and activity logs. Once deleted, this data cannot be recovered.
            </p>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 hover:bg-red-900/50 px-5 py-2.5 text-xs font-bold text-red-300 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account &amp; Wipe All Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
