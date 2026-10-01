import React from "react";
import Link from "next/link";
import { verifyAndConsumeShareToken } from "@/lib/share-verifier";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  CreditCard,
  FileCheck2,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ShareViewPageProps {
  params: { token: string };
}

export default async function ShareViewPage({ params }: ShareViewPageProps) {
  const result = await verifyAndConsumeShareToken(params.token, {
    actor: "Public Web Verifier",
  });

  const isValid = result.valid && result.status === "Valid";

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Top Banner Status */}
      <div
        className={`rounded-2xl p-6 border shadow-2xl glass-panel text-center space-y-3 ${
          isValid
            ? "border-emerald-500/30 bg-emerald-950/20 shadow-emerald-500/10"
            : "border-red-500/30 bg-red-950/20 shadow-red-500/10"
        }`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          {isValid ? (
            <div className="h-14 w-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
              <XCircle className="h-8 w-8" />
            </div>
          )}
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isValid
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-red-500/20 text-red-300 border border-red-500/40"
            }`}
          >
            {result.status}
          </span>

          <h1 className="text-xl sm:text-2xl font-bold text-white mt-2">
            {isValid ? "Cryptographically Verified Claims" : "Verification Failed"}
          </h1>

          {!isValid && (
            <p className="text-xs text-red-400 mt-1 max-w-md mx-auto">
              {result.error || "The provided token is invalid, expired, or has been revoked."}
            </p>
          )}
        </div>
      </div>

      {isValid && (
        <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-b border-white/5 pb-4">
            <div>
              <span className="text-slate-400 block text-[11px]">Subject (Wallet ID)</span>
              <strong className="text-white font-mono">{result.subject}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Preset / Type</span>
              <span className="text-indigo-300 capitalize">
                {result.preset?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[11px]">Valid Until</span>
              <span className="text-slate-300">
                {result.expiresAt ? new Date(result.expiresAt).toLocaleTimeString() : "—"}
              </span>
            </div>
          </div>

          {/* Stated Purpose */}
          <div className="rounded-xl bg-slate-900/60 p-3.5 border border-white/5 text-xs flex items-center justify-between">
            <span className="text-slate-400">Authorized Purpose:</span>
            <span className="font-semibold text-white">{result.purpose}</span>
          </div>

          {/* Disclosed Claims Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Disclosed Claims (Selective Disclosure)
              </h3>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Ed25519 Signed</span>
              </span>
            </div>

            {/* Special Case: Age 18+ preset */}
            {result.preset === "age_18_plus" ? (
              <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-slate-900 p-6 text-center space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Age Verification</h4>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-4 py-2 border border-white/10">
                    <span className="text-xs text-slate-300">Over 18 Years:</span>
                    <strong className="text-base text-emerald-400 font-mono">
                      {result.claims?.over18 ? "YES (True)" : "NO (False)"}
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Protected under DPDP Act 2023 principles: Name, Date of Birth, Address, and
                  Government Document Numbers are <strong>not disclosed</strong>.
                </p>
              </div>
            ) : result.preset === "driving_auth" ? (
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-slate-400">Driving Authorization Status:</span>
                  <span
                    className={`font-semibold ${
                      result.claims?.drivingLicenseValid ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {result.claims?.drivingLicenseValid ? "Valid & Authorized" : "Expired / Invalid"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Authorized Vehicle Classes:</span>
                  <strong className="text-white font-mono">
                    {Array.isArray(result.claims?.vehicleClasses)
                      ? result.claims?.vehicleClasses.join(", ")
                      : "—"}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Organ Donor Consent:</span>
                  <span className="text-white">
                    {result.claims?.organDonor ? "Registered Donor" : "No"}
                  </span>
                </div>
              </div>
            ) : result.preset === "ration_entitlement" ? (
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-slate-400">Food Security Scheme:</span>
                  <span className="font-semibold text-white">{String(result.claims?.scheme || "NFSA")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg bg-slate-900 p-3 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Remaining Rice</span>
                    <strong className="text-base text-emerald-400">
                      {String(result.claims?.remainingRiceKg || 0)} kg
                    </strong>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Remaining Wheat</span>
                    <strong className="text-base text-amber-400">
                      {String(result.claims?.remainingWheatKg || 0)} kg
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              /* Generic Claims Key-Value list */
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 space-y-2 text-xs">
                {Object.entries(result.claims || {}).map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-medium text-white text-right break-all">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5"
            >
              <span>← Back to White Card Wallet</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
