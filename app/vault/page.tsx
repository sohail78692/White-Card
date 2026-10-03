"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/validators/documents";
import { AddDocumentModal } from "@/components/AddDocumentModal";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
import { DocumentIcon } from "@/components/DocumentIcon";
import {
  FolderLock,
  Plus,
  Search,
  Paperclip,
  Building,
  Loader2,
  Lock,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

export default function VaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<DocumentType>("DRIVING_LICENSE");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setLoading(false);
      } else if (res.status === 401) {
        // Unauthenticated visitor: immediately prompt sign in with return redirect
        window.location.href = "/signin?redirect=/vault";
        return;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const categories = ["All", "Identity", "Financial", "Welfare", "Random"];

  const filteredDocs = documents.filter((doc) => {
    const meta = DOCUMENT_TYPES[doc.type as DocumentType];
    const category = meta?.category || "Identity";
    const title = doc.customTitle || meta?.title || doc.type;

    const matchesCategory = filterCategory === "All" || category === filterCategory;
    const matchesSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      doc.maskedNumber.toLowerCase().includes(search.toLowerCase()) ||
      (doc.issuer && doc.issuer.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full glass-ios-pill px-3.5 py-1 text-xs font-semibold text-neutral-300">
            <FolderLock className="h-3.5 w-3.5 text-blue-400" />
            <span>Encrypted Vault</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Document <span className="text-[#60a5fa]">Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Your sovereign identity credentials &amp; encrypted documents, locked safely on your device with unique DEK envelope encryption.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playFlip();
            setAddModalType("DRIVING_LICENSE");
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-full bg-white hover:bg-neutral-100 px-5 py-2.5 text-xs font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Document</span>
        </button>
      </div>

      {/* Core Identity Hub (5-Card Linked Status Tray) */}
      <div className="rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 sm:p-5 space-y-3 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Sovereign Identity &amp; Document Hub
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 font-medium">
            {documents.length} Linked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {(["DRIVING_LICENSE", "PAN", "VOTER_ID", "RATION_CARD", "RANDOM"] as DocumentType[]).map((docType) => {
            const meta = DOCUMENT_TYPES[docType];
            const matchedDoc = documents.find((d) => d.type === docType);
            const isLinked = !!matchedDoc;

            return (
              <div
                key={docType}
                onClick={() => {
                  if (isLinked) {
                    sound.playFlip();
                    setSelectedDocId(matchedDoc.id);
                  } else {
                    sound.playPop();
                    setAddModalType(docType);
                    setShowAddModal(true);
                  }
                }}
                className={`rounded-[20px] p-3 sm:p-3.5 border transition-all duration-300 cursor-pointer flex items-center justify-between backdrop-blur-xl group hover:scale-[1.02] active:scale-[0.98] ${
                  isLinked
                    ? "bg-white/[0.06] border-white/15 hover:border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                    : "bg-white/[0.02] border-dashed border-white/10 hover:border-sky-400/40 hover:bg-sky-500/[0.05]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <DocumentIcon type={docType} size="sm" className="group-hover:scale-110" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate leading-tight group-hover:text-sky-300 transition-colors">
                      {meta.title}
                    </div>
                    <div className="text-[10px] font-mono mt-0.5 truncate text-neutral-400">
                      {isLinked ? matchedDoc.maskedNumber : "Not Linked"}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                    isLinked
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "bg-white/[0.06] border-white/10 text-neutral-400 group-hover:border-sky-400/40 group-hover:text-sky-300"
                  }`}
                >
                  {isLinked ? "✓ Linked" : "+ Add"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playTone(440, "sine", 0.04);
                setFilterCategory(cat);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all shrink-0 backdrop-blur-md ${
                filterCategory === cat
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-white/[0.05] text-neutral-400 border border-white/10 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none z-10" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vault..."
            className="w-full rounded-full border border-white/10 bg-white/[0.04] pl-10 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:border-white/30 focus:outline-none backdrop-blur-md transition relative z-0"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition z-10 p-0.5"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-[28px] glass-ios-card p-12 text-center space-y-4 border border-white/10 max-w-md mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/10 text-sky-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Your Vault is Empty</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Add your Driving License, PAN Card, Voter ID, or Ration Card to securely store and share.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:scale-105 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Document</span>
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-neutral-400">
          No documents matched your search or category filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredDocs.map((doc) => {
            const meta = DOCUMENT_TYPES[doc.type as DocumentType];
            const isExpired = doc.status === "expired";

            return (
              <div
                key={doc.id}
                onClick={() => {
                  sound.playFlip();
                  setSelectedDocId(doc.id);
                }}
                className="group cursor-pointer rounded-[24px] glass-ios-card p-5 border border-white/[0.09] hover:border-white/[0.22] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] space-y-4 relative backdrop-blur-xl"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <DocumentIcon type={doc.type} size="md" className="group-hover:scale-105" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition leading-tight">
                          {doc.customTitle || meta?.title || doc.type}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {doc.type === "PAN" ? "Income Tax Dept" : meta?.category || "Identity"}
                        </span>
                        {meta?.shortCode && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-neutral-300 border border-white/5 font-semibold">
                            {meta.shortCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                      isExpired
                        ? "bg-red-500/10 text-red-300 border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                    }`}
                  >
                    {isExpired ? "Expired" : "Self-declared"}
                  </span>
                </div>

                {/* ID Card Mini Banner / Holder Preview */}
                {(doc.details?.name || doc.details?.fullName) && (
                  <div className="flex items-center justify-between text-[11px] px-1 text-neutral-300">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Holder:</span>
                    <span className="font-mono font-bold uppercase truncate max-w-[170px] text-white">
                      {doc.details.name || doc.details.fullName}
                    </span>
                  </div>
                )}

                {/* Masked Number Styled Card Band */}
                <div className={`rounded-2xl p-3.5 border flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                  doc.type === "PAN"
                    ? "bg-gradient-to-r from-purple-950/40 via-indigo-900/30 to-purple-950/40 border-purple-500/20"
                    : doc.type === "DRIVING_LICENSE"
                    ? "bg-gradient-to-r from-blue-950/40 via-sky-900/30 to-blue-950/40 border-blue-500/20"
                    : doc.type === "VOTER_ID"
                    ? "bg-gradient-to-r from-emerald-950/40 via-teal-900/30 to-emerald-950/40 border-emerald-500/20"
                    : doc.type === "RANDOM"
                    ? "bg-gradient-to-r from-pink-950/40 via-rose-900/30 to-pink-950/40 border-pink-500/20"
                    : "bg-gradient-to-r from-amber-950/40 via-yellow-900/30 to-amber-950/40 border-amber-500/20"
                }`}>
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400 block font-bold">
                      {doc.type === "PAN"
                        ? "Permanent Account Number"
                        : doc.type === "DRIVING_LICENSE"
                        ? "Driving Licence Identifier"
                        : doc.type === "VOTER_ID"
                        ? "Elector Photo ID (EPIC)"
                        : doc.type === "RANDOM"
                        ? "Custom Document Identifier"
                        : "National Food Security Card"}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-white/95">
                      {doc.maskedNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-white/80 font-serif">
                      {doc.type === "PAN"
                        ? "🇮🇳 ITD"
                        : doc.type === "DRIVING_LICENSE"
                        ? "🚗 MoRTH"
                        : doc.type === "VOTER_ID"
                        ? "🗳️ ECI"
                        : doc.type === "RANDOM"
                        ? "🪪 RND"
                        : "🌾 NFSA"}
                    </span>
                    <Lock className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                    <Building className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                    <span className="truncate">{doc.issuer || "Self-declared"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.attachmentCount > 0 && (
                      <div className="flex items-center gap-1 text-sky-400 shrink-0 font-medium">
                        <Paperclip className="h-3 w-3" />
                        <span>{doc.attachmentCount}</span>
                      </div>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddDocumentModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchDocs}
          initialType={addModalType}
        />
      )}

      {selectedDocId && (
        <DocumentDetailModal
          docId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
          onDeleted={fetchDocs}
        />
      )}
    </div>
  );
}
