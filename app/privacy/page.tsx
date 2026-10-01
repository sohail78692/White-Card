"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import {
  ShieldCheck,
  ShieldAlert,
  History,
  FileCheck2,
  Download,
  Trash2,
  Ban,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  FileText,
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
      setChainStatus({ intact: false, reason: "Network error during chain verification" });
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleExportAuditLogs = () => {
    sound.playSuccess();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `whitecard-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "WARNING: This action is permanent and irreversible under the DPDP Act.\n\nAll your encrypted documents, shares, sessions, and audit records will be immediately erased.\n\nType 'ERASE MY ACCOUNT' to confirm:"
    );

    if (confirmation !== "ERASE MY ACCOUNT") {
      alert("Account erasure cancelled.");
      return;
    }

    try {
      const res = await fetch("/api/vault/account", { method: "DELETE" });
      if (res.ok) {
        sound.playSuccess();
        alert("Your account and all personal identity data have been completely erased.");
        window.location.href = "/";
      } else {
        sound.playError();
        alert("Failed to delete account. Please try again.");
      }
    } catch {
      sound.playError();
      alert("Network error during erasure request.");
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Privacy & Audit Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident mathematical audit trail, consent management, data export, and DPDP erasure.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: "audit", label: "Audit Hash Chain", icon: History },
            { id: "consents", label: "Consents", icon: FileCheck2 },
            { id: "blocklist", label: "Blocklist", icon: Ban },
            { id: "data", label: "Export & Erasure", icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Audit Hash Chain */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* Tamper Verification Banner */}
          <div className="rounded-2xl glass-panel p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">SHA-256 Tamper-Evident Hash Chain</h3>
              </div>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Every wallet event is cryptographically linked to the previous block hash:{" "}
                <code className="text-indigo-300 font-mono text-[11px]">
                  hash = SHA-256(prevHash + canonicalJSON(entry))
                </code>
                . If any record in MongoDB is modified, inserted, or deleted out of order, the chain breaks.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleVerifyChain}
                disabled={verifyingChain}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {verifyingChain ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Verify Chain Integrity</span>
              </button>

              <button
                type="button"
                onClick={handleExportAuditLogs}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                <Download className="h-4 w-4 text-cyan-400" />
                <span className="hidden sm:inline">Export Log</span>
              </button>
            </div>
          </div>

          {/* Verification Result Feedback */}
          {chainStatus && (
            <div
              className={`rounded-xl p-4 border flex items-start gap-3 text-xs ${
                chainStatus.intact
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/40 border-red-500/30 text-red-300"
              }`}
            >
              {chainStatus.intact ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block font-semibold">
                  {chainStatus.intact
                    ? "Audit Chain Mathematically Verified Intact!"
                    : "Tampering Detected in Audit Log!"}
                </strong>
                <span className="text-[11px] opacity-90">
                  {chainStatus.intact
                    ? `All ${chainStatus.totalEntries} sequential entries from genesis (seq 0) verified without discrepancies.`
                    : `Broken link at sequence index ${chainStatus.firstBrokenIndex}: ${chainStatus.reason}`}
                </span>
              </div>
            </div>
          )}

          {/* Action Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-slate-400 mr-2">Filter Action:</span>
            {[
              { id: "all", label: "All Actions" },
              { id: "verify", label: "Verifications" },
              { id: "link_document", label: "Linked Docs" },
              { id: "create_share", label: "Shares Created" },
              { id: "revoke_share", label: "Revocations" },
              { id: "ration_dispense", label: "Ration Dispenses" },
              { id: "polling_checkin", label: "Polling Checkins" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActionFilter(f.id)}
                className={`rounded-lg px-3 py-1 font-medium transition shrink-0 ${
                  actionFilter === f.id
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                    : "bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No audit entries match filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5 pr-3 font-semibold">Seq</th>
                      <th className="py-2.5 pr-4 font-semibold">Timestamp</th>
                      <th className="py-2.5 pr-4 font-semibold">Actor</th>
                      <th className="py-2.5 pr-4 font-semibold">Action</th>
                      <th className="py-2.5 pr-4 font-semibold">Disclosed Fields</th>
                      <th className="py-2.5 pr-4 font-semibold">Result</th>
                      <th className="py-2.5 font-mono text-[11px] text-right">SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                      <tr key={log.seq} className="text-slate-300 hover:bg-white/[0.02]">
                        <td className="py-3 pr-3 font-mono font-bold text-indigo-400">{log.seq}</td>
                        <td className="py-3 pr-4 text-[11px] text-slate-400">
                          {new Date(log.ts).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 font-medium text-white">{log.actor}</td>
                        <td className="py-3 pr-4 capitalize text-indigo-300">
                          {log.action.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {log.fields && log.fields.length > 0 ? (
                              log.fields.map((f: string) => (
                                <span
                                  key={f}
                                  className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-300 border border-white/5 font-mono"
                                >
                                  {f}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
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
                        <td className="py-3 text-right font-mono text-[11px] text-slate-400">
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
        <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              DPDP Act Explicit Consent Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Full record of explicit consents granted by you for selective disclosure tokens.
            </p>
          </div>

          {consents.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No consents recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Granted At</th>
                    <th className="py-2.5 pr-4 font-semibold">Purpose</th>
                    <th className="py-2.5 pr-4 font-semibold">Audience</th>
                    <th className="py-2.5 pr-4 font-semibold">Duration</th>
                    <th className="py-2.5 font-semibold">Consented Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {consents.map((c) => (
                    <tr key={c.id} className="text-slate-300">
                      <td className="py-3 pr-4 text-[11px] text-slate-400">
                        {new Date(c.at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 font-medium text-white">{c.purpose}</td>
                      <td className="py-3 pr-4 uppercase text-[11px] text-indigo-300">{c.audience}</td>
                      <td className="py-3 pr-4">{c.duration / 60} minutes</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.fields?.map((f: string) => (
                            <span
                              key={f}
                              className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-indigo-200 border border-white/5 font-mono"
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
        <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Verifier Access Blocklist
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Blocked verifiers are rejected immediately by the verification engine, even if presented with a signed token.
            </p>
          </div>

          {blocklist.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-400">
              No verifiers currently blocked.
            </div>
          ) : (
            <div className="space-y-2">
              {blocklist.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-slate-900/60 p-4 border border-white/5 text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-white">{b.verifierName}</h4>
                    <span className="text-[10px] text-slate-400 uppercase">{b.verifierType}</span>
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
                    className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Data Export & Right to Erasure */}
      {activeTab === "data" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Right to Export */}
          <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-500/20 text-indigo-400">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Right to Data Portability</h3>
                <span className="text-[11px] text-slate-400">DPDP Act Section 12</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Export your entire encrypted personal wallet in machine-readable JSON format. Includes
              all decrypted document numbers, metadata, share token history, and profile attributes.
            </p>

            <a
              href="/api/vault/export"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <Download className="h-4 w-4" />
              <span>Download Complete Wallet JSON</span>
            </a>
          </div>

          {/* Right to Erasure (Account Deletion) */}
          <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-red-500/20 bg-red-950/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950 border border-red-500/30 text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Right to Erasure</h3>
                <span className="text-[11px] text-red-400">Irreversible Deletion</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Irreversibly delete your account, wrapped DEK, documents, attachments, sessions, passkeys,
              and sequential audit trail from MongoDB.
            </p>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-900/40 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition"
            >
              <Trash2 className="h-4 w-4" />
              <span>Erase All Personal Data & Delete Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
