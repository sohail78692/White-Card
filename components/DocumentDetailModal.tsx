"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Eye,
  Sparkles,
  Edit3,
  Save,
  CheckCircle2,
} from "lucide-react";
import { DocumentIcon } from "@/components/DocumentIcon";
import { DOCUMENT_TYPES, DocumentType, ALLOWED_DETAILS_BY_TYPE, sanitizeDetailsForType } from "@/lib/validators/documents";
import { PhysicalIdCardView } from "@/components/PhysicalIdCardView";

interface DocumentDetailModalProps {
  docId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DocumentDetailModal({ docId, onClose, onDeleted }: DocumentDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [doc, setDoc] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [extractingAttId, setExtractingAttId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit form states
  const [editNumber, setEditNumber] = useState("");
  const [editName, setEditName] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editDob, setEditDob] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Esc key listener, focus trap, and body scroll lock
  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
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
        const rawDoc = d.document;
        const cleanDetails = sanitizeDetailsForType(rawDoc.type as DocumentType, rawDoc.details || {});
        rawDoc.details = cleanDetails;
        setDoc(rawDoc);
        setEditNumber(rawDoc.number || "");
        setEditName(cleanDetails.name || cleanDetails.fullName || "");
        setEditFatherName(cleanDetails.fatherName || "");
        setEditDob(cleanDetails.dob || "");
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

  const handleSaveEdits = async () => {
    setSavingEdit(true);
    setError(null);
    try {
      const updates: Record<string, any> = {
        number: editNumber.trim().toUpperCase(),
        details: sanitizeDetailsForType(doc.type as DocumentType, {
          name: editName.trim(),
          fatherName: editFatherName.trim(),
          dob: editDob.trim(),
        }),
      };

      const res = await fetch(`/api/vault/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Failed to update details");
      } else {
        sound.playSuccess();
        setIsEditing(false);
        setSuccessMessage("Document details updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadData();
      }
    } catch {
      sound.playError();
      setError("Network error while updating details");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExtractFromAttachment = async (att: any) => {
    setExtractingAttId(att.id);
    setError(null);
    try {
      // 1. Immediate match on filename (e.g., in.gov.pan-PANCR-FORPA5522R.pdf)
      const panFilenameMatch = att.filename.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
      const dlFilenameMatch = att.filename.match(/\b([A-Z]{2}[0-9]{13,15})\b/i);
      const voterFilenameMatch = att.filename.match(/\b([A-Z]{3}[0-9]{7})\b/i);

      let directNumber: string | null = null;
      if (panFilenameMatch && doc?.type === "PAN") directNumber = panFilenameMatch[1].toUpperCase();
      if (dlFilenameMatch && doc?.type === "DRIVING_LICENSE") directNumber = dlFilenameMatch[1].toUpperCase();
      if (voterFilenameMatch && doc?.type === "VOTER_ID") directNumber = voterFilenameMatch[1].toUpperCase();

      // 2. Fetch the decrypted attachment
      const fileRes = await fetch(`/api/vault/${docId}/attachment/${att.id}`);
      if (!fileRes.ok) throw new Error("Could not read attachment");

      const blob = await fileRes.blob();
      const file = new File([blob], att.filename, { type: att.mime });
      const extFormData = new FormData();
      extFormData.append("file", file);

      const extRes = await fetch("/api/vault/extract", {
        method: "POST",
        body: extFormData,
      });

      const extData = await extRes.json();
      const extracted = extData.extracted || {};
      const finalNumber = extracted.number || directNumber;

      const updates: Record<string, any> = {};
      if (finalNumber) updates.number = finalNumber;

      const detUpdates: Record<string, any> = {};
      if (extracted.name) detUpdates.name = extracted.name;
      if (extracted.fatherName) detUpdates.fatherName = extracted.fatherName;
      if (extracted.dob) detUpdates.dob = extracted.dob;
      if (Object.keys(detUpdates).length > 0) updates.details = detUpdates;
      if (extracted.issuer) updates.issuer = extracted.issuer;

      if (Object.keys(updates).length > 0) {
        const patchRes = await fetch(`/api/vault/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        const patchData = await patchRes.json();
        if (patchRes.ok) {
          sound.playSuccess();
          setSuccessMessage(`Auto-extracted ID (${updates.number || "details"}) from ${att.filename}!`);
          setTimeout(() => setSuccessMessage(null), 4000);
          await loadData();
          return;
        } else {
          setError(patchData.error || "Failed to update with extracted data");
        }
      } else {
        setError("No new ID number or details could be found in this attachment.");
      }
    } catch (err: any) {
      sound.playError();
      setError(err.message || "Failed to extract from attachment");
    } finally {
      setExtractingAttId(null);
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
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploading(true);
    setError(null);

    let file = rawFile;
    // Auto-compress photos so standard phone photos (<10MB) upload smoothly within 500KB limit
    if (rawFile.type.startsWith("image/") || rawFile.name.match(/\.(jpe?g|png|webp)$/i)) {
      try {
        file = await new Promise<File>((resolve) => {
          const img = new Image();
          const url = URL.createObjectURL(rawFile);
          img.onload = () => {
            URL.revokeObjectURL(url);
            const maxDim = 1200;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(rawFile);
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
              (blob) => {
                if (!blob) return resolve(rawFile);
                const cleanName = rawFile.name.replace(/\.[^.]+$/, ".jpg");
                resolve(new File([blob], cleanName, { type: "image/jpeg" }));
              },
              "image/jpeg",
              0.85
            );
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(rawFile);
          };
          img.src = url;
        });
      } catch {
        file = rawFile;
      }
    }

    if (file.size > 500 * 1024) {
      setUploading(false);
      setError("File exceeds 500 KB limit. Please select a smaller photo or crop it.");
      return;
    }

    const hasFront = attachments.some((a) => a.filename?.toLowerCase().includes("front"));
    let uploadName = file.name;
    if (!hasFront && (file.type.startsWith("image/") || file.name.match(/\.(jpe?g|png|webp)$/i))) {
      uploadName = `${doc?.type || "DOC"}_FRONT.jpg`;
    }

    const formData = new FormData();
    formData.append("file", file, uploadName);

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

        // Automatically run extraction on the uploaded file
        try {
          const extFormData = new FormData();
          extFormData.append("file", file);
          const extRes = await fetch("/api/vault/extract", {
            method: "POST",
            body: extFormData,
          });

          if (extRes.ok) {
            const extData = await extRes.json();
            const extracted = extData.extracted || {};
            const panFilenameMatch = file.name.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
            const foundNumber = extracted.number || (panFilenameMatch && doc?.type === "PAN" ? panFilenameMatch[1].toUpperCase() : null);

            const updates: Record<string, any> = {};
            if (foundNumber) updates.number = foundNumber;

            const detUpdates: Record<string, any> = {};
            if (extracted.name) detUpdates.name = extracted.name;
            if (extracted.fatherName) detUpdates.fatherName = extracted.fatherName;
            if (extracted.dob) detUpdates.dob = extracted.dob;
            if (Object.keys(detUpdates).length > 0) updates.details = detUpdates;

            if (Object.keys(updates).length > 0) {
              await fetch(`/api/vault/${docId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
              });
              setSuccessMessage(`Auto-extracted ID (${updates.number || "details"}) and updated document!`);
              setTimeout(() => setSuccessMessage(null), 4000);
            }
          }
        } catch {
          // Ignore auto-extraction error on background upload
        }

        await loadData();
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

  const meta = doc?.type ? DOCUMENT_TYPES[doc.type as DocumentType] : null;

  // Extract front and back image attachments for physical view
  const imageAttachments = attachments.filter((a) => a.mime?.startsWith("image/"));
  const frontAtt =
    imageAttachments.find((a) => a.filename.toLowerCase().includes("front")) ||
    imageAttachments[0] ||
    null;
  const backAtt =
    imageAttachments.find((a) => a.filename.toLowerCase().includes("back")) ||
    (imageAttachments.length > 1 ? imageAttachments[1] : null);

  const frontImageUrl = frontAtt ? `/api/vault/${docId}/attachment/${frontAtt.id}` : null;
  const backImageUrl = backAtt ? `/api/vault/${docId}/attachment/${backAtt.id}` : null;

  const isDefaultPlaceholder = doc?.number === "ABCDE1234F" || doc?.number?.startsWith("ABCDE12");

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-doc-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[32px] glass-ios-card p-5 sm:p-8 shadow-2xl border border-white/15 backdrop-blur-2xl space-y-6"
      >
        {/* Header with Document Squircle */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            {doc?.type && <DocumentIcon type={doc.type} size="lg" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-white/90 border border-white/10">
                  {meta?.title || doc?.type?.replace(/_/g, " ")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  Self-declared
                </span>
              </div>
              <h2 id="modal-doc-title" className="text-xl font-bold text-white mt-1 tracking-tight">
                {doc?.customTitle || meta?.title || doc?.type?.replace(/_/g, " ")}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-white/[0.08] hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-3.5 text-xs text-emerald-300 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
          </div>
        ) : doc ? (
          <div className="space-y-6">
            {/* REAL PHYSICAL / GOVERNMENT ID CARD REPLICA */}
            <div className="space-y-2">
              <PhysicalIdCardView
                type={doc.type}
                number={doc.number}
                name={doc.details?.name || doc.details?.fullName || doc.details?.cardholderName}
                issuer={doc.issuer}
                expiry={doc.expiry}
                details={doc.details}
                frontImageUrl={frontImageUrl}
                backImageUrl={backImageUrl}
                onUploadPhoto={() => fileInputRef.current?.click()}
              />
            </div>

            {/* Smart Banner: If default placeholder and attachments exist, offer 1-click sync */}
            {isDefaultPlaceholder && attachments.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-sky-950/70 to-indigo-950/70 border border-sky-400/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                    <span>Auto-Extract Real ID Details</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Your card currently has placeholder number. Click to sync real details from your attached file ({attachments[0].filename}).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={extractingAttId !== null}
                  onClick={() => handleExtractFromAttachment(attachments[0])}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-sky-500 hover:bg-sky-400 px-4 py-1.5 text-xs font-bold text-black transition active:scale-95 disabled:opacity-50"
                >
                  {extractingAttId === attachments[0].id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Extract & Sync</span>
                </button>
              </div>
            )}

            {/* Decrypted Number & Quick Actions */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Document Identifier (Decrypted)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>{isEditing ? "Cancel" : "Edit / Fix"}</span>
                  </button>
                </div>
              </div>

              {isEditing ? (
                /* INLINE EDIT MODE */
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                      Card / ID Number
                    </label>
                    <input
                      type="text"
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. FORPA5522R"
                      className="w-full rounded-xl bg-white/[0.08] border border-white/20 px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full rounded-xl bg-white/[0.08] border border-white/20 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                        Father&apos;s Name
                      </label>
                      <input
                        type="text"
                        value={editFatherName}
                        onChange={(e) => setEditFatherName(e.target.value)}
                        placeholder="Father's Name"
                        className="w-full rounded-xl bg-white/[0.08] border border-white/20 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full rounded-xl bg-white/[0.08] border border-white/20 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-full text-xs text-neutral-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={handleSaveEdits}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-neutral-200 transition active:scale-95 disabled:opacity-50"
                    >
                      {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY NUMBER DISPLAY */
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-mono font-bold tracking-wider text-white select-all break-all">
                    {doc.number}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(doc.number)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95"
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
              )}
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Building className="h-3.5 w-3.5" />
                  <span>Issuer</span>
                </div>
                <div className="font-semibold text-white">{doc.issuer || "Self-Declared"}</div>
              </div>

              <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Valid Until / Expiry</span>
                </div>
                <div className="font-semibold text-white">
                  {doc.expiry ? new Date(doc.expiry).toLocaleDateString() : "Permanent / None"}
                </div>
              </div>
            </div>

            {/* Type-Specific Details (Strictly isolated by document type) */}
            {doc.details && (() => {
              const allowedKeys = ALLOWED_DETAILS_BY_TYPE[doc.type as DocumentType] || [];
              const validEntries = Object.entries(doc.details).filter(
                ([k, v]) => allowedKeys.includes(k) && v !== undefined && v !== null && v !== ""
              );
              if (validEntries.length === 0) return null;
              return (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                    Encrypted Attributes & Metadata
                  </span>
                  <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {validEntries.map(([k, v]) => (
                      <div key={k} className="space-y-0.5">
                        <span className="text-neutral-400 capitalize text-[11px]">
                          {k.replace(/([A-Z])/g, " $1").toLowerCase()}
                        </span>
                        <div className="font-medium text-white/90">
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
              );
            })()}

            {/* Encrypted Attachments Section with 1-Click Auto-Extraction */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-sky-400" />
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
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-3.5 py-1 text-xs font-semibold text-white transition active:scale-95"
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
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-neutral-400">
                  No encrypted attachments added yet (PDF, JPG, PNG).
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => {
                    const isImg = att.mime?.startsWith("image/");
                    const isExtracting = extractingAttId === att.id;

                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-3 border border-white/5 text-xs hover:border-white/10 transition gap-2"
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          {isImg ? (
                            <a
                              href={`/api/vault/${docId}/attachment/${att.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="relative block h-12 w-16 rounded-xl overflow-hidden border border-white/10 shrink-0 group/img hover:border-sky-400 transition"
                              title="Click to view full image"
                            >
                              <img
                                src={`/api/vault/${docId}/attachment/${att.id}`}
                                alt={att.filename}
                                className="h-full w-full object-cover group-hover/img:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                                <Eye className="h-3.5 w-3.5 text-white" />
                              </div>
                            </a>
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-sky-400 shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}

                          <div className="truncate min-w-0">
                            <a
                              href={`/api/vault/${docId}/attachment/${att.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-white hover:text-sky-300 hover:underline truncate block"
                            >
                              {att.filename}
                            </a>
                            <span className="text-[10px] text-neutral-400 mt-0.5 block">
                              {(att.size / 1024).toFixed(1)} KB • {att.mime}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* 1-Click Extract Button for this file */}
                          <button
                            type="button"
                            onClick={() => handleExtractFromAttachment(att)}
                            disabled={isExtracting}
                            className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 text-[11px] font-semibold text-sky-300 transition active:scale-95 disabled:opacity-50"
                            title="Extract ID Number & Details from this attachment"
                          >
                            {isExtracting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 text-sky-400" />
                            )}
                            <span className="hidden sm:inline">Extract Data</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="rounded-full p-2 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition"
                            title="Delete attachment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions: Delete Document */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Added on {new Date(doc.createdAt).toLocaleDateString()}
              </span>

              <button
                type="button"
                onClick={handleDeleteDoc}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition disabled:opacity-50"
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
    </div>,
    document.body
  );
}
