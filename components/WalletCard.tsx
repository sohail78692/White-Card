"use client";

import React, { useState, useMemo } from "react";
import { sound } from "@/lib/sound";
import {
  Folder,
  FolderOpen,
  CarFront,
  FileText,
  Vote,
  Wheat,
  Plus,
  ShieldCheck,
  Lock,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { DocumentType } from "@/lib/validators/documents";

interface WalletCardProps {
  walletId: string;
  userName?: string;
  linkedDocsCount?: number;
  emergencyContact?: string;
  onUpdateEmergencyContact?: (contact: string) => void;
  onEmergencyContactChange?: (contact: string) => void;
  documents?: any[];
  onAddDocument?: () => void;
  onOpenDocument?: (docId: string) => void;
}

const DOC_CONFIG: Record<
  DocumentType,
  {
    title: string;
    gradient: string;
    tagPrefix: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  DRIVING_LICENSE: {
    title: "Driving License",
    gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    tagPrefix: "DL",
    icon: CarFront,
  },
  PAN: {
    title: "PAN Card",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
    tagPrefix: "PAN",
    icon: FileText,
  },
  VOTER_ID: {
    title: "Voter ID",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    tagPrefix: "EPIC",
    icon: Vote,
  },
  RATION_CARD: {
    title: "Ration Card",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    tagPrefix: "RC",
    icon: Wheat,
  },
};

const DOC_ALIASES: Record<string, string[]> = {
  DRIVING_LICENSE: [
    "dl", "drive", "driver", "driving", "license", "licence", "morth",
    "transport", "vehicle", "lmv", "mcwg", "rto", "car", "bike", "auto"
  ],
  PAN: [
    "pan", "pancard", "tax", "income tax", "itd", "nsdl", "uti", "taxpayer"
  ],
  VOTER_ID: [
    "voter", "epic", "election", "eci", "voting", "vote", "chunav", "matdaata", "constituency", "booth"
  ],
  RATION_CARD: [
    "ration", "rc", "rashan", "nfsa", "khadya", "food", "pds", "bpl", "apl", "aay", "quota", "depot", "grain"
  ],
};

function buildDocSearchCorpus(doc: any): string {
  const type = (doc.type || "") as DocumentType;
  const cfg = DOC_CONFIG[type];
  const aliases = DOC_ALIASES[type] || [];

  const tokens: string[] = [
    type.toLowerCase(),
    type.replace(/_/g, " ").toLowerCase(),
    cfg ? cfg.title.toLowerCase() : "",
    cfg ? cfg.tagPrefix.toLowerCase() : "",
    ...aliases,
    (doc.customTitle || "").toLowerCase(),
    (doc.maskedNumber || "").toLowerCase(),
    (doc.number || "").toLowerCase(),
    (doc.maskedNumber || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
    (doc.number || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
  ];

  if (doc.details && typeof doc.details === "object") {
    for (const val of Object.values(doc.details)) {
      if (typeof val === "string") {
        tokens.push(val.toLowerCase());
        tokens.push(val.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
      } else if (Array.isArray(val)) {
        tokens.push(val.join(" ").toLowerCase());
      }
    }
  }

  return tokens.join(" ");
}

export function WalletCard({
  walletId,
  userName = "Personal Wallet Holder",
  linkedDocsCount = 0,
  emergencyContact = "+91 98765 43210",
  documents = [],
  onAddDocument,
  onOpenDocument,
}: WalletCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return documents;

    const terms = rawQuery.split(/\s+/).filter(Boolean);

    return documents.filter((doc) => {
      const corpus = buildDocSearchCorpus(doc);
      return terms.every((term) => {
        const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, "");
        return corpus.includes(term) || (cleanTerm && corpus.includes(cleanTerm));
      });
    });
  }, [documents, searchQuery]);

  const docCount = searchQuery.trim() ? filteredDocs.length : documents.length;
  const countStr = String(docCount).padStart(2, "0");

  const handleToggle = () => {
    sound.playPop();
    setIsOpen(!isOpen);
  };

  const getCountClass = (total: number) => {
    if (total <= 1) return "file-count-1";
    if (total === 2) return "file-count-2";
    if (total === 3) return "file-count-3";
    if (total === 4) return "file-count-4";
    return "file-count-many";
  };

  return (
    <div className="folder-card-wrapper pt-16 pb-8 sm:pt-20 sm:pb-10 px-4 sm:px-8">
      {/* 3D Interactive Folder Label Wrapper */}
      <div className="folder-card">
        {/* Hidden toggle input bound to state */}
        <input
          type="checkbox"
          className="folder-toggle"
          checked={isOpen}
          onChange={handleToggle}
          id="wallet-folder-toggle"
        />

        {/* 3D Folder Container */}
        <div className="folder-container">
          {/* Floating Search Bar (Appears when open) */}
          <div className="folder-search" onClick={(e) => e.stopPropagation()}>
            <Search className="folder-search-icon text-white/90" />
            <input
              type="text"
              placeholder="Search cards (DL, PAN, Voter...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="folder-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setSearchQuery("");
                }}
                className="text-white/80 hover:text-white p-1 ml-0.5 transition flex-shrink-0"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Folder Back Face (Royal Navy Blue) */}
          <svg
            className="folder-back cursor-pointer"
            viewBox="0 0 50 40"
            fill="none"
            onClick={handleToggle}
          >
            <path
              d="M0 4C0 1.79086 1.79086 0 4 0H16.524C17.721 0 18.8415 0.54051 19.574 1.4673L22.426 5.0654C23.1585 5.99219 24.279 6.5327 25.476 6.5327H46C48.2091 6.5327 50 8.32356 50 10.5327V36C50 38.2091 48.2091 40 46 40H4C1.79086 40 0 38.2091 0 36V4Z"
              fill="#004da3"
            />
          </svg>

          {/* ============================================================== */}
          {/* DYNAMIC CARDS POPPING UP FROM INSIDE FOLDER                    */}
          {/* ============================================================== */}
          {filteredDocs.length === 0 ? (
            documents.length === 0 ? (
              /* Empty State Card if 0 documents linked in entire wallet */
              <div
                className="folder-file file-count-1 file-idx-0 border border-dashed border-sky-400/50"
                style={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  zIndex: 25,
                }}
                onClick={() => {
                  sound.playPop();
                  if (onAddDocument) onAddDocument();
                }}
              >
                <div className="folder-shine" />
                <Plus className="folder-file-icon text-sky-400" />
                <div className="folder-file-text">
                  <div>+ Link First Document</div>
                  <div className="folder-file-subtext text-sky-300">Tap to add ID</div>
                </div>
                <div className="folder-file-tag">EMPTY • + ADD</div>
              </div>
            ) : (
              /* Search yielded 0 results */
              <div
                className="folder-file file-count-1 file-idx-0 border border-white/20 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
                  zIndex: 25,
                }}
                onClick={() => {
                  sound.playPop();
                  setSearchQuery("");
                }}
                title="Tap to clear search"
              >
                <div className="folder-shine" />
                <SearchX className="folder-file-icon text-amber-400" />
                <div className="folder-file-text">
                  <div className="truncate pr-4 text-white font-bold">No cards match</div>
                  <div className="folder-file-subtext text-sky-300 truncate">
                    Tap to clear &apos;{searchQuery}&apos;
                  </div>
                </div>
                <div className="folder-file-tag">0 FOUND • RESET</div>
              </div>
            )
          ) : (
            /* Render exactly as many cards as matched (1, 2, 3, 4...) */
            filteredDocs.map((doc, idx) => {
              const docType = doc.type as DocumentType;
              const cfg = DOC_CONFIG[docType] || {
                title: doc.customTitle || doc.type,
                gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                tagPrefix: "DOC",
                icon: FileText,
              };
              const IconComponent = cfg.icon;
              const countClass = getCountClass(filteredDocs.length);
              const zIndex = 25 - idx;

              return (
                <div
                  key={doc.id || idx}
                  className={`folder-file ${countClass} file-idx-${idx}`}
                  style={{
                    background: cfg.gradient,
                    zIndex,
                    transitionDelay: `${idx * 0.03}s`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playFlip();
                    if (onOpenDocument) onOpenDocument(doc.id);
                  }}
                  title={`Click to inspect ${cfg.title}`}
                >
                  <div className="folder-shine" />
                  <IconComponent className="folder-file-icon" />
                  <div className="folder-file-text">
                    <div className="truncate pr-5">{doc.customTitle || cfg.title}</div>
                    <div className="folder-file-subtext truncate">
                      {doc.details?.name || doc.maskedNumber}
                    </div>
                  </div>
                  <div className="folder-file-tag">
                    {cfg.tagPrefix} • {doc.maskedNumber?.slice(-4) || "ACTIVE"}
                  </div>
                </div>
              );
            })
          )}

          {/* Folder Front Flap Wrapper (Frosted Apple Acrylic Glass) */}
          <div
            className="folder-front-wrapper cursor-pointer"
            onClick={handleToggle}
            title={isOpen ? "Click to close folder" : "Click to open folder"}
          >
            <svg className="folder-front" viewBox="0 0 50 34" fill="none">
              <path
                d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z"
                fill="rgba(0, 102, 230, 0.72)"
              />
            </svg>

            {/* Folder Front Face Information Overlay */}
            <div className="absolute inset-0 p-3 flex items-start justify-between pointer-events-none select-none z-10 text-white">
              {/* Brand Label */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
                <Lock className="h-2.5 w-2.5 text-sky-200" />
                <span className="text-[8.5px] font-bold tracking-wider uppercase text-white/90">
                  White Card
                </span>
              </div>
              {/* Card Count Tag */}
              <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/25 backdrop-blur-md text-sky-200 border border-white/10">
                {docCount} {docCount === 1 ? "CARD" : "CARDS"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Outside Folder Action Button */}
      <div className="mt-7 flex flex-col items-center">
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-1.5 text-xs font-semibold text-sky-200 transition active:scale-95 shadow-sm"
        >
          {isOpen ? (
            <>
              <FolderOpen className="h-3.5 w-3.5 text-sky-400" />
              <span>Close Card Holder</span>
            </>
          ) : (
            <>
              <Folder className="h-3.5 w-3.5 text-sky-400" />
              <span>Open Card Holder ({docCount} {docCount === 1 ? "card" : "cards"})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
