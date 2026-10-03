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
  IdCard,
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
  privacyShield?: boolean;
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
  RANDOM: {
    title: "Random Document",
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    tagPrefix: "RND",
    icon: IdCard,
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
  RANDOM: [
    "random", "other", "custom", "doc", "id", "card", "misc", "passport", "pass", "membership", "insurance"
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
  privacyShield = false,
  documents = [],
  onAddDocument,
  onOpenDocument,
}: WalletCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 3D Parallax Mouse Tracking State
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    if (isOpen) {
      // Gentle 3D perspective tilt while open
      const rotX = 8 + ((y - centerY) / centerY) * -5;
      const rotY = ((x - centerX) / centerX) * 8;
      setRotateX(rotX);
      setRotateY(rotY);
    } else {
      const rotX = ((y - centerY) / centerY) * -12;
      const rotY = ((x - centerX) / centerX) * 14;
      setRotateX(rotX);
      setRotateY(rotY);
    }
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: isOpen ? 0.35 : 0.65,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    sound.playTone(580, "sine", 0.04);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(isOpen ? 8 : 0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

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
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    setRotateX(nextOpen ? 8 : 0);
    setRotateY(0);
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
      {/* 3D Interactive Folder Label Wrapper with Parallax Tilt */}
      <div
        className="folder-card group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hidden toggle input bound to state */}
        <input
          type="checkbox"
          className="folder-toggle"
          checked={isOpen}
          onChange={handleToggle}
          id="wallet-folder-toggle"
        />

        {/* 3D Folder Container */}
        <div
          className="folder-container"
          style={{
            transform: isOpen
              ? `rotateX(${rotateX || 8}deg) rotateY(${rotateY}deg) scale(1.02)`
              : isHovered
              ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.04)`
              : undefined,
          }}
        >
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
                className="folder-file file-count-1 file-idx-0 border border-dashed border-sky-400/40 hover:border-sky-400 group/card transition-all duration-300 shadow-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)",
                  zIndex: 25,
                }}
                onMouseEnter={() => sound.playTone(620, "sine", 0.03)}
                onClick={() => {
                  sound.playPop();
                  if (onAddDocument) onAddDocument();
                }}
              >
                <div className="folder-shine" />
                <div className="h-7 w-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 absolute top-3.5 right-3.5 group-hover/card:scale-110 group-hover/card:bg-sky-500/30 transition-all duration-300 shadow-sm">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="folder-file-text">
                  <div className="text-white group-hover/card:text-sky-300 transition-colors font-bold">+ Link First Document</div>
                  <div className="folder-file-subtext text-sky-400/90 flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
                    <span>Tap to add ID</span>
                  </div>
                </div>
                <div className="folder-file-tag bg-sky-950/80 border border-sky-500/30 text-sky-200">
                  EMPTY • + ADD
                </div>
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
                  onMouseEnter={() => sound.playTone(560 + idx * 45, "sine", 0.02)}
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
                    <div className="folder-file-subtext truncate transition-all duration-300">
                      {privacyShield ? (
                        <span className="font-mono tracking-widest text-[9.5px] opacity-75 group-hover:opacity-100 transition-opacity">
                          •••• •••• ••••
                        </span>
                      ) : (
                        doc.details?.name || doc.maskedNumber
                      )}
                    </div>
                  </div>
                  <div className="folder-file-tag transition-all duration-300">
                    {privacyShield
                      ? `${cfg.tagPrefix} • ••••`
                      : `${cfg.tagPrefix} • ${doc.maskedNumber?.slice(-4) || "ACTIVE"}`}
                  </div>
                </div>
              );
            })
          )}

          {/* Folder Front Flap Wrapper (Frosted Apple Acrylic Glass) */}
          <div
            className="folder-front-wrapper cursor-pointer overflow-hidden"
            onClick={handleToggle}
            title={isOpen ? "Click to close folder" : "Click to open folder"}
          >
            {/* Holographic Laser Light Sweep across front surface on hover */}
            <div
              className={`absolute top-0 -left-[140%] w-[90%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none transition-all duration-1000 z-20 ${
                isHovered && !isOpen ? "left-[160%]" : ""
              }`}
            />

            {/* Specular Interactive Mouse Glare tracking */}
            <div
              className="absolute inset-0 rounded-[12px] pointer-events-none transition-opacity duration-200 overflow-hidden mix-blend-overlay z-20"
              style={{
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.7) 0%, rgba(147, 197, 253, 0.3) 35%, transparent 65%)`,
                opacity: isHovered && !isOpen ? glarePos.opacity : 0,
              }}
            />

            <svg className="folder-front" viewBox="0 0 50 34" fill="none">
              <defs>
                <linearGradient id="folder-front-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0077fa" stopOpacity="0.86" />
                  <stop offset="100%" stopColor="#0052cc" stopOpacity="0.94" />
                </linearGradient>
                <linearGradient id="folder-border-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
                </linearGradient>
              </defs>
              <path
                d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z"
                fill="url(#folder-front-grad)"
                stroke="url(#folder-border-grad)"
                strokeWidth="0.6"
              />
            </svg>

            {/* Subtle Guilloche / Geometric Security Border Pattern inside front pocket */}
            <div className="absolute inset-2 rounded-lg border border-dashed border-white/20 pointer-events-none opacity-30" />

            {/* Folder Front Face Information Overlay */}
            <div className="absolute inset-0 p-3 flex items-start justify-between pointer-events-none select-none z-10 text-white">
              {/* Brand Label with live padlock and shimmer */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-[0_2px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.45)] transition-transform group-hover:scale-105">
                <Lock className={`h-2.5 w-2.5 text-sky-200 ${isHovered ? "animate-pulse" : ""}`} />
                <span className="text-[8.5px] font-bold tracking-wider uppercase text-white drop-shadow">
                  White Card
                </span>
              </div>
            </div>

            {/* Hint label on hover when closed */}
            <div
              className={`absolute bottom-3.5 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none z-10 ${
                isHovered && !isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
              }`}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.18] backdrop-blur-xl border border-white/30 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.45)]">
                <span className="text-[10px] font-semibold text-white tracking-wide">
                  Open Wallet
                </span>
                <span className="text-sky-200 text-xs font-bold transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
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
