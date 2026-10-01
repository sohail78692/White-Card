"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/validators/documents";
import { AddDocumentModal } from "@/components/AddDocumentModal";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
import {
  FolderLock,
  Plus,
  Search,
  Paperclip,
  Calendar,
  Building,
  Loader2,
  Lock,
  FileCheck,
  CreditCard,
  AlertCircle,
} from "lucide-react";

export default function VaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const categories = ["All", "Identity", "Financial", "Welfare"];

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
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Document Vault
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Store and manage client-encrypted documents. Stored as ciphertext (AES-256-GCM).
          </p>
        </div>

        <button
          onClick={() => {
            sound.playFlip();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition shrink-0 ${
                filterCategory === cat
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vault..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl glass-panel p-12 text-center space-y-4 border border-white/10 max-w-md mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/60 border border-indigo-500/20 text-indigo-400">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Your Vault is Empty</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Add your Driving License, PAN, Voter ID, or Ration Card to start sharing selective claims.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Document</span>
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-400">
          No documents matched your search or category filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className="group cursor-pointer rounded-2xl glass-panel p-5 border border-white/10 hover:border-indigo-500/40 hover:shadow-glow transition space-y-4 relative"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                        {doc.customTitle || meta?.title || doc.type}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {meta?.category || "Identity"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                      isExpired
                        ? "bg-red-950/60 text-red-300 border-red-500/30"
                        : "bg-amber-950/60 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {isExpired ? "Expired" : "Self-declared"}
                  </span>
                </div>

                {/* Masked Number */}
                <div className="rounded-xl bg-slate-900/80 p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-200">
                    {doc.maskedNumber}
                  </span>
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                    <Building className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{doc.issuer || "Self-declared"}</span>
                  </div>

                  {doc.attachmentCount > 0 && (
                    <div className="flex items-center gap-1 text-cyan-400 shrink-0">
                      <Paperclip className="h-3 w-3" />
                      <span>{doc.attachmentCount}</span>
                    </div>
                  )}
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
