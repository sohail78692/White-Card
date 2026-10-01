"use client";

import React, { useState } from "react";
import { sound } from "@/lib/sound";
import {
  DOCUMENT_TYPES,
  DocumentType,
  validateDocumentNumber,
} from "@/lib/validators/documents";
import {
  X,
  Plus,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface AddDocumentModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddDocumentModal({ onClose, onAdded }: AddDocumentModalProps) {
  const [type, setType] = useState<DocumentType>("DRIVING_LICENSE");
  const [number, setNumber] = useState("");
  const [issuer, setIssuer] = useState("Ministry of Road Transport & Highways");
  const [expiry, setExpiry] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({
    vehicleClasses: ["MCWG", "LMV"],
    organDonor: true,
    rto: "DL-01",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMeta = DOCUMENT_TYPES[type];

  const handleTypeChange = (newType: DocumentType) => {
    setType(newType);
    setError(null);
    setNumber("");

    // Set sensible default issuers and details structure for the 4 documents
    switch (newType) {
      case "DRIVING_LICENSE":
        setIssuer("Ministry of Road Transport & Highways");
        setDetails({ vehicleClasses: ["MCWG", "LMV"], organDonor: true, rto: "DL-01" });
        break;
      case "PAN":
        setIssuer("Income Tax Department");
        setDetails({ fatherName: "", taxpayerCategory: "Individual", aadhaarLinked: "Linked" });
        break;
      case "VOTER_ID":
        setIssuer("Election Commission");
        setDetails({ acNumber: "AC-42", pollingBooth: "Booth 12A", parliamentaryConstituency: "South", partSerial: "24/110" });
        break;
      case "RATION_CARD":
        setIssuer("Department of Food and Civil Supplies");
        setDetails({
          scheme: "NFSA-PHH",
          fpsDepotId: "FPS-9842",
          familyMembersCount: 4,
          monthlyRiceQuotaKg: 20,
          monthlyWheatQuotaKg: 15,
        });
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate number
    const validation = validateDocumentNumber(type, number);
    if (!validation.valid) {
      sound.playError();
      setError(validation.error || "Invalid document number format");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          number: validation.normalized,
          issuer: issuer.trim(),
          expiry: expiry || undefined,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Failed to add document");
      } else {
        sound.playSuccess();
        onAdded();
        onClose();
      }
    } catch {
      sound.playError();
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/60 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Client Envelope Encrypted</span>
            </span>
            <h2 id="modal-add-title" className="text-xl font-bold text-white mt-1">
              Link Document to Vault
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Document Type Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Document Type
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as DocumentType)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {Object.values(DOCUMENT_TYPES).map((docMeta) => (
                <option key={docMeta.type} value={docMeta.type}>
                  {docMeta.title} ({docMeta.category})
                </option>
              ))}
            </select>
          </div>


          {/* Document Number with auto-uppercase and hint */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {selectedMeta.numberLabel}
            </label>
            <input
              type="text"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value.toUpperCase())}
              placeholder={selectedMeta.placeholder}
              className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">{selectedMeta.hint}</p>
          </div>

          {/* Issuer & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Issuing Authority / State
              </label>
              <input
                type="text"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Type-Specific Details */}
          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Attributes for Selective Disclosure
            </span>

            {type === "DRIVING_LICENSE" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">RTO Code</label>
                  <input
                    type="text"
                    value={details.rto || ""}
                    onChange={(e) => setDetails({ ...details, rto: e.target.value.toUpperCase() })}
                    placeholder="DL-01"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Organ Donor</label>
                  <select
                    value={details.organDonor ? "true" : "false"}
                    onChange={(e) => setDetails({ ...details, organDonor: e.target.value === "true" })}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            )}

            {type === "PAN" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={details.fatherName || ""}
                    onChange={(e) => setDetails({ ...details, fatherName: e.target.value })}
                    placeholder="Father's Full Name"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Taxpayer Category</label>
                  <select
                    value={details.taxpayerCategory || "Individual"}
                    onChange={(e) => setDetails({ ...details, taxpayerCategory: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                  >
                    <option value="Individual">Individual</option>
                    <option value="HUF">HUF</option>
                    <option value="Company">Company</option>
                    <option value="Firm">Firm</option>
                  </select>
                </div>
              </div>
            )}

            {type === "VOTER_ID" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Assembly Constituency</label>
                  <input
                    type="text"
                    value={details.acNumber || ""}
                    onChange={(e) => setDetails({ ...details, acNumber: e.target.value })}
                    placeholder="AC-42"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Polling Booth</label>
                  <input
                    type="text"
                    value={details.pollingBooth || ""}
                    onChange={(e) => setDetails({ ...details, pollingBooth: e.target.value })}
                    placeholder="Booth 12A"
                    className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {type === "RATION_CARD" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Ration Scheme</label>
                    <select
                      value={details.scheme || "NFSA-PHH"}
                      onChange={(e) => setDetails({ ...details, scheme: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                    >
                      <option value="NFSA-AAY">Antyodaya Anna Yojana (AAY)</option>
                      <option value="NFSA-PHH">Priority Household (PHH)</option>
                      <option value="Non-NFSA">Non-NFSA General</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">FPS Depot ID</label>
                    <input
                      type="text"
                      value={details.fpsDepotId || ""}
                      onChange={(e) => setDetails({ ...details, fpsDepotId: e.target.value.toUpperCase() })}
                      placeholder="FPS-9842"
                      className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Monthly Rice Quota (kg)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={details.monthlyRiceQuotaKg || 20}
                      onChange={(e) => setDetails({ ...details, monthlyRiceQuotaKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Monthly Wheat Quota (kg)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={details.monthlyWheatQuotaKg || 15}
                      onChange={(e) => setDetails({ ...details, monthlyWheatQuotaKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !number}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Encrypt & Add to Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
