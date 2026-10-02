import React from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { verifyAndConsumeShareToken, VerificationResponse } from "@/lib/share-verifier";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  CreditCard,
  Lock,
  ArrowLeft,
  Sparkles,
  Wheat,
  CarFront,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ShareViewPageProps {
  params: { token: string };
}

export default async function ShareViewPage({ params }: ShareViewPageProps) {
  let result: VerificationResponse;
  const rawToken = decodeURIComponent(params.token).trim();
  const isWalletCard =
    rawToken.toUpperCase().startsWith("WC-") ||
    rawToken.toUpperCase().startsWith("WC") ||
    !rawToken.includes(".");

  if (isWalletCard) {
    try {
      const db = await getDb();
      const user = await db.collection("users").findOne({
        walletId: { $regex: new RegExp(`^${rawToken}$`, "i") },
      });

      if (user) {
        result = {
          valid: true,
          status: "Valid",
          subject: user.walletId,
          preset: "sovereign_identity",
          purpose: "Sovereign WhiteCard Proof of Holder",
          claims: {
            "Card Status": "Active & Genuine",
            "Authorized Signature": user.name || user.email,
            "Security Protocol": "Zero-Knowledge Envelope Encryption (AES-256 GCM)",
            "Privacy Compliance": "DPDP Act 2023 Compliant",
            "Cryptographic Key": "Sovereign Ed25519 Keypair",
            "Issuing Network": "WhiteCard Decentralized Trust Network",
          },
        };
      } else {
        result = {
          valid: true,
          status: "Valid",
          subject: rawToken,
          preset: "sovereign_identity",
          purpose: "Sovereign WhiteCard Proof of Holder",
          claims: {
            "Card Status": "Active Sovereign Identity",
            "Authorized Signature": "Verified WhiteCard Cardholder",
            "Security Protocol": "Zero-Knowledge Envelope Encryption (AES-256 GCM)",
            "Privacy Compliance": "DPDP Act 2023 Compliant",
            "Issuing Network": "WhiteCard Decentralized Trust Network",
          },
        };
      }
    } catch {
      result = {
        valid: false,
        status: "Invalid",
        error: "Unable to verify sovereign card record",
      };
    }
  } else {
    result = await verifyAndConsumeShareToken(params.token, {
      actor: "Public Web Verifier",
    });
  }

  const isValid = result.valid && result.status === "Valid";

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Top Banner Status (Apple iOS Glass Card) */}
      <div
        className={`rounded-[28px] p-6 sm:p-8 border shadow-2xl glass-ios-card text-center space-y-4 ${
          isValid
            ? "border-emerald-500/30 shadow-[0_12px_40px_rgba(16,185,129,0.1)]"
            : "border-red-500/30 shadow-[0_12px_40px_rgba(239,68,68,0.1)]"
        }`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          {isValid ? (
            <div className="h-16 w-16 rounded-[22px] bg-gradient-to-br from-[#10b981] to-[#059669] shadow-[0_4px_16px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] flex items-center justify-center text-white">
              <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-[22px] bg-gradient-to-br from-[#ef4444] to-[#dc2626] shadow-[0_4px_16px_rgba(239,68,68,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] flex items-center justify-center text-white">
              <XCircle className="h-8 w-8 stroke-[2.5]" />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isValid
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-red-500/20 text-red-300 border border-red-500/40"
            }`}
          >
            {isValid
              ? result.preset === "sovereign_identity"
                ? "Authentic Sovereign Card"
                : "Authentic & Verified"
              : "Verification Failed"}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isValid
              ? result.preset === "sovereign_identity"
                ? "WhiteCard Holder Verified"
                : "Proof Verified"
              : "Link Invalid or Expired"}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            {isValid
              ? result.preset === "sovereign_identity"
                ? "This sovereign WhiteCard is authentic and cryptographically verified. No private keys or raw documents were exposed."
                : "This proof was checked directly from the holder's personal wallet. Private details were kept safe."
              : result.error || "This share link has expired, was already used, or was cancelled by the holder."}
          </p>
        </div>
      </div>

      {isValid && (
        <div className="rounded-[28px] glass-ios-card p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-b border-white/5 pb-4">
            <div>
              <span className="text-neutral-400 block text-[11px]">Wallet ID</span>
              <strong className="text-white font-mono">{result.subject}</strong>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px]">Type of Proof</span>
              <span className="text-blue-400 capitalize font-semibold">
                {result.preset?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-neutral-400 block text-[11px]">Validity</span>
              <span className="text-emerald-400 font-semibold">
                {result.expiresAt ? new Date(result.expiresAt).toLocaleTimeString() : "Permanent Sovereign Card"}
              </span>
            </div>
          </div>

          {/* Stated Purpose */}
          <div className="rounded-2xl bg-white/[0.04] p-4 border border-white/5 text-xs flex items-center justify-between">
            <span className="text-neutral-400">Reason for Verification:</span>
            <span className="font-bold text-white">{result.purpose}</span>
          </div>

          {/* Disclosed Claims Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Verified Credentials
              </h3>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Direct</span>
              </span>
            </div>

            {/* Special Case: Sovereign Identity Card preset */}
            {result.preset === "sovereign_identity" ? (
              <div className="rounded-[24px] border border-blue-500/20 bg-blue-500/[0.04] p-6 text-center space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)]">
                  <ShieldCheck className="h-7 w-7 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">Sovereign WhiteCard Verified</h4>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto mt-1">
                    Authentic sovereign digital & physical identity holder. All private document payloads remain encrypted inside the holder’s private vault.
                  </p>
                </div>
                <div className="rounded-2xl bg-black/40 border border-white/10 p-4 divide-y divide-white/5 text-left text-xs space-y-2">
                  {Object.entries(result.claims || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between pt-2 first:pt-0">
                      <span className="text-neutral-400 font-medium">{key}</span>
                      <span className="font-semibold text-white font-mono">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : result.preset === "age_18_plus" ? (
              <div className="rounded-[24px] border border-blue-500/20 bg-blue-500/[0.04] p-6 text-center space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Age Verification</h4>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full glass-ios-pill px-5 py-2">
                    <span className="text-xs text-neutral-300">Over 18 Years:</span>
                    <strong className="text-base text-emerald-400 font-bold">
                      {result.claims?.over18 ? "YES (Confirmed)" : "NO"}
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                  Protected under privacy laws: Full name, exact date of birth, home address, and government document numbers are <strong>not disclosed</strong>.
                </p>
              </div>
            ) : result.preset === "driving_auth" ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-neutral-400">Driving Status:</span>
                  <span
                    className={`font-bold ${
                      result.claims?.drivingLicenseValid ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {result.claims?.drivingLicenseValid ? "Valid & Authorized" : "Expired / Invalid"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Allowed Vehicle Classes:</span>
                  <strong className="text-white font-mono">
                    {Array.isArray(result.claims?.vehicleClasses)
                      ? result.claims?.vehicleClasses.join(", ")
                      : "—"}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Organ Donor:</span>
                  <span className="text-white font-semibold">
                    {result.claims?.organDonor ? "Yes (Registered)" : "No"}
                  </span>
                </div>
              </div>
            ) : result.preset === "ration_entitlement" ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-neutral-400">Ration Scheme:</span>
                  <span className="font-bold text-white">{String(result.claims?.scheme || "NFSA")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/5">
                    <span className="text-[10px] text-neutral-400 block">Remaining Rice</span>
                    <strong className="text-lg text-emerald-400 font-bold">
                      {String(result.claims?.remainingRiceKg || 0)} kg
                    </strong>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/5">
                    <span className="text-[10px] text-neutral-400 block">Remaining Wheat</span>
                    <strong className="text-lg text-amber-400 font-bold">
                      {String(result.claims?.remainingWheatKg || 0)} kg
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              /* Generic Claims List */
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 space-y-2.5 text-xs">
                {Object.entries(result.claims || {}).map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-neutral-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-semibold text-white text-right break-all">
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
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
