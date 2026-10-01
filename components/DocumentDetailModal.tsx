"use client";

import React, { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/sound";
import {
  X,
  Copy,
  Check,
  Trash2,
  Paperclip,
  FileText,
  Upload,
  AlertCircle,
  Calendar,
  Building,
  ShieldCheck,
  Loader2,
  FileBadge,
} from "lucide-react";

interface DocumentDetailModalProps {
  docId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DocumentDetailModal({ docId, onClose, onDeleted }: DocumentDetailModalProps) {
  const [doc, setDoc] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Esc key listener and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, attRes] = await Promise.all([
        fetch(`/api/vault/${docId}`),
        fetch(`/api/vault/${docId}/attachment`),
      ]);

      if (docRes.ok) {
        const d = await docRes.json();
        setDoc(d.document);
      } else {
        setError("Failed to load document details");
      }

      if (attRes.ok) {
        const a = await attRes.json();
        setAttachments(a.attachments || []);
      }
    } catch {
      setError("Network error loading document");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [docId]);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-https or older browser
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      sound.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      sound.playError();
    }
  };

  const handleDeleteDoc = async () => {
    if (!confirm("Are you sure you want to permanently delete this document from your encrypted vault?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/vault/${docId}`, { method: "DELETE" });
      if (res.ok) {
        sound.playSuccess();
        onDeleted();
        onClose();
      } else {
        sound.playError();
        const err = await res.json();
        setError(err.error || "Failed to delete document");
      }
    } catch {
      sound.playError();
      setError("Network error while deleting");
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError("File exceeds 500 KB limit");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/vault/${docId}/attachment`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Failed to upload file");
      } else {
        sound.playSuccess();
        loadData();
      }
    } catch {
      sound.playError();
      setError("Network error during upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    try {
      const res = await fetch(`/api/vault/${docId}/attachment/${attId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        sound.playSuccess();
        setAttachments((prev) => prev.filter((a) => a.id !== attId));
      }
    } catch {
      sound.playError();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-doc-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-white/5">
                {doc?.type ? doc.type.replace(/_/g, " ") : "Document"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                Self-declared
              </span>
            </div>
            <h2 id="modal-doc-title" className="text-xl font-bold text-white mt-1">
              {doc?.customTitle || doc?.type?.replace(/_/g, " ")}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close modal"
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : doc ? (
          <div className="space-y-6">
            {/* Decrypted Number with Copy Button */}
            <div className="rounded-xl bg-slate-900/90 border border-white/10 p-4 space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Document Identifier (Decrypted)
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-mono font-bold tracking-wider text-white select-all break-all">
                  {doc.number}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(doc.number)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  title="Copy ID"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Building className="h-3.5 w-3.5" />
                  <span>Issuer</span>
                </div>
                <div className="font-semibold text-white">{doc.issuer || "Self-Declared"}</div>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Valid Until / Expiry</span>
                </div>
                <div className="font-semibold text-white">
                  {doc.expiry ? new Date(doc.expiry).toLocaleDateString() : "Permanent / None"}
                </div>
              </div>
            </div>

            {/* Type-Specific Details */}
            {doc.details && Object.keys(doc.details).length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Encrypted Attributes & Metadata
                </span>
                <div className="rounded-xl bg-slate-900/60 border border-white/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(doc.details).map(([k, v]) => (
                    <div key={k} className="space-y-0.5">
                      <span className="text-slate-400 capitalize text-[11px]">
                        {k.replace(/([A-Z])/g, " $1").toLowerCase()}
                      </span>
                      <div className="font-medium text-slate-200">
                        {Array.isArray(v)
                          ? v.join(", ")
                          : typeof v === "boolean"
                          ? v ? "Yes" : "No"
                          : String(v || "—")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encrypted Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Encrypted Attachments ({attachments.length}/5)</span>
                </span>

                {attachments.length < 5 && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="att-upload-input"
                    />
                    <label
                      htmlFor="att-upload-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 transition"
                    >
                      {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>Upload (Max 500KB)</span>
                    </label>
                  </div>
                )}
              </div>

              {attachments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-400">
                  No encrypted attachments added yet (PDF, JPG, PNG).
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                        <div className="truncate">
                          <a
                            href={`/api/vault/${docId}/attachment/${att.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-white hover:text-cyan-300 hover:underline truncate block"
                          >
                            {att.filename}
                          </a>
                          <span className="text-[10px] text-slate-400">
                            {(att.size / 1024).toFixed(1)} KB • {att.mime}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-950/50 hover:text-red-400 transition"
                        title="Delete attachment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Delete Document */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Added on {new Date(doc.createdAt).toLocaleDateString()}
              </span>

              <button
                type="button"
                onClick={handleDeleteDoc}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-950/40 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/50 transition disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete Document</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
