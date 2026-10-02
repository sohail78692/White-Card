"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentType } from "@/lib/validators/documents";
import {
  RotateCw,
  Sparkles,
  Eye,
  User,
  QrCode,
} from "lucide-react";

interface PhysicalIdCardViewProps {
  type: DocumentType;
  number: string;
  name?: string;
  issuer?: string;
  expiry?: string;
  details?: Record<string, any>;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  className?: string;
  onUploadPhoto?: () => void;
}

/**
 * Official Ashoka Lion Capital (Emblem of India) SVG
 */
function NationalEmblemOfIndia({ className = "h-8 w-8 text-slate-800" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 125" className={className} fill="currentColor">
      {/* Three Lions */}
      <path d="M50 6 C46 6 43 9 41 13 C38 10 33 9 29 12 C25 15 24 21 26 26 C24 30 25 36 29 40 C32 44 38 46 42 45 C44 48 48 50 50 50 C52 50 56 48 58 45 C62 46 68 44 71 40 C75 36 76 30 74 26 C76 21 75 15 71 12 C67 9 62 10 59 13 C57 9 54 6 50 6 Z" />
      {/* Facial muzzle details */}
      <path d="M47 19 C47 17 48 16 50 16 C52 16 53 17 53 19 C53 22 52 25 50 25 C48 25 47 22 47 19 Z" fill="#ffffff" opacity="0.9" />
      <path d="M37 24 C35 28 36 32 39 34 C40 31 40 26 37 24 Z M63 24 C61 26 60 31 61 34 C64 32 65 28 63 24 Z" fill="#ffffff" opacity="0.9" />
      {/* Abacus Base */}
      <rect x="18" y="54" width="64" height="11" rx="2" />
      {/* Dharma Chakra in Center */}
      <circle cx="50" cy="59.5" r="4.8" fill="#ffffff" />
      <circle cx="50" cy="59.5" r="2.2" fill="currentColor" />
      {/* Bull and Horse */}
      <circle cx="30" cy="59.5" r="2.6" fill="#ffffff" opacity="0.9" />
      <circle cx="70" cy="59.5" r="2.6" fill="#ffffff" opacity="0.9" />
      {/* Bell / Lotus Pedestal */}
      <path d="M15 67 L85 67 L76 79 L24 79 Z" />
      <path d="M24 79 C32 91 40 97 50 97 C60 97 68 91 76 79 Z" />
      {/* Satyameva Jayate in Devanagari */}
      <text x="50" y="112" textAnchor="middle" fontSize="11" fontFamily="serif" fontWeight="bold">
        सत्यमेव जयते
      </text>
    </svg>
  );
}

export function PhysicalIdCardView({
  type,
  number,
  name,
  issuer,
  expiry,
  details = {},
  frontImageUrl,
  backImageUrl,
  className = "",
  onUploadPhoto,
}: PhysicalIdCardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "photo">(
    frontImageUrl || backImageUrl ? "photo" : "card"
  );
  const [isFullCardImage, setIsFullCardImage] = useState(true);

  // 3D Interactive Tilt & Holographic Sheen physics
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (frontImageUrl || backImageUrl) {
      setViewMode("photo");
    }
  }, [frontImageUrl, backImageUrl]);

  // Determine whether uploaded photo is horizontal full card or portrait face
  useEffect(() => {
    if (!frontImageUrl) return;
    const img = new Image();
    img.onload = () => {
      setIsFullCardImage(img.width > img.height * 1.05);
    };
    img.src = frontImageUrl;
  }, [frontImageUrl]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((y - centerY) / centerY) * -7;
    const rotY = ((x - centerX) / centerX) * 7;
    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const cardholderName =
    name || details.name || details.fullName || details.cardholderName || "SOHAIL AKHTAR";
  const fatherName = details.fatherName || details.fathersName || "SAHIMUDDIN ANSARI";
  const dob = details.dob || details.dateOfBirth || "10/01/2006";

  // If user uploaded a real image and wants to see the photo
  if (viewMode === "photo" && (frontImageUrl || backImageUrl)) {
    const currentPhoto = isFlipped && backImageUrl ? backImageUrl : (frontImageUrl || backImageUrl);
    return (
      <div className={`space-y-2.5 ${className}`}>
        {/* Toggle Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Real ID Photo ({isFlipped ? "Back Side" : "Front Side"})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {backImageUrl && frontImageUrl && (
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1 text-[11px] font-semibold text-sky-300 border border-white/10 transition active:scale-95"
              >
                <RotateCw className="h-3 w-3" />
                <span>Show {isFlipped ? "Front" : "Back"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1 text-[11px] font-semibold text-neutral-300 border border-white/10 transition active:scale-95"
            >
              <span>Digital View</span>
            </button>
          </div>
        </div>

        {/* Real Card Frame */}
        <div className="relative w-full aspect-[1.586/1] rounded-[24px] overflow-hidden border border-white/20 shadow-2xl bg-black group select-none">
          <img
            src={currentPhoto!}
            alt="Real ID Card"
            className="w-full h-full object-contain bg-slate-950"
          />
          <div className="absolute bottom-2.5 left-3 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
            Encrypted DEK Vault Storage • {isFlipped ? "Back" : "Front"}
          </div>
        </div>
      </div>
    );
  }

  // Realistic Digital Card Replica (High-fidelity Government Design)
  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Toggle Bar if photo available */}
      {frontImageUrl && (
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Official Digital Card
          </span>
          <button
            type="button"
            onClick={() => setViewMode("photo")}
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-600/30 hover:bg-sky-600/50 px-3 py-1 text-[11px] font-semibold text-sky-200 border border-sky-400/40 transition active:scale-95 shadow"
          >
            <Eye className="h-3 w-3 text-sky-300" />
            <span>Show Real ID Photo</span>
          </button>
        </div>
      )}

      {/* If no real card photo has been uploaded yet, show quick upload action */}
      {!frontImageUrl && !backImageUrl && onUploadPhoto && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-950/70 to-blue-950/70 border border-sky-400/30 p-3 text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
            <span>Upload your real PAN Card photo to show it here</span>
          </div>
          <button
            type="button"
            onClick={onUploadPhoto}
            className="rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 px-3.5 py-1 text-xs font-bold transition active:scale-95 shrink-0 shadow"
          >
            Upload Real Card
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAN CARD OFFICIAL GOVERNMENT OF INDIA HIGH-FIDELITY DESIGN     */}
      {/* ============================================================== */}
      {type === "PAN" && (
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: "transform 0.15s ease-out",
          }}
          className="relative w-full aspect-[1.586/1] rounded-[22px] sm:rounded-[26px] overflow-hidden border border-sky-300/70 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_2px_4px_rgba(0,0,0,0.3)] p-3.5 sm:p-5 flex flex-col justify-between select-none text-slate-900 bg-gradient-to-br from-[#d4ecfd] via-[#e8f5fe] to-[#bde1f9]"
        >
          {/* Authentic Banknote Guilloche Security Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.16] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pan-guilloche-pat" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20 Q 10 0, 20 20 T 40 20" fill="none" stroke="#0284c7" strokeWidth="0.6" />
                <path d="M0 10 Q 10 30, 20 10 T 40 10" fill="none" stroke="#0369a1" strokeWidth="0.5" />
                <path d="M0 30 Q 10 10, 20 30 T 40 30" fill="none" stroke="#0284c7" strokeWidth="0.5" />
                <circle cx="20" cy="20" r="14" fill="none" stroke="#0ea5e9" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pan-guilloche-pat)" />
          </svg>

          {/* Central Ashoka Lion Capital Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.065] pointer-events-none">
            <NationalEmblemOfIndia className="h-52 w-52 text-sky-950" />
          </div>

          {/* Dynamic 3D Holographic Foil Glare on mouse move */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(253, 224, 71, 0.15) 25%, rgba(56, 189, 248, 0.2) 50%, transparent 70%)`,
              opacity: glarePos.opacity,
              mixBlendMode: "overlay",
            }}
          />

          {/* Laminated PVC Reflection Sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.12] to-transparent pointer-events-none" />

          {/* Top Header Bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-sky-900/20 pb-2">
            <div className="leading-tight text-left">
              <span className="text-[10px] sm:text-[12px] font-black tracking-wider text-slate-900 uppercase block font-serif">
                आयकर विभाग
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] font-extrabold text-slate-800 tracking-wide uppercase block">
                INCOME TAX DEPARTMENT
              </span>
            </div>

            <div className="flex flex-col items-center">
              <NationalEmblemOfIndia className="h-7 w-7 sm:h-8 sm:w-8 text-slate-900 drop-shadow-sm" />
            </div>

            <div className="flex items-center gap-2 text-right">
              <div className="leading-tight">
                <span className="text-[10px] sm:text-[12px] font-black tracking-wider text-slate-900 uppercase block font-serif">
                  भारत सरकार
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] font-extrabold text-slate-800 tracking-wide uppercase block">
                  GOVT. OF INDIA
                </span>
              </div>
              {/* Metallic Optical Variable Security Hologram */}
              <div className="relative h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-tr from-[#fcd34d] via-[#6ee7b7] via-[#c084fc] to-[#38bdf8] shadow border border-amber-200/90 flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),transparent_65%)]" />
                <span className="text-[6px] font-black text-slate-800 opacity-90 uppercase tracking-tighter">ITD</span>
              </div>
            </div>
          </div>

          {/* Main Card Body (Authentic Indian Layout: Photo & DOB & Signature on Left, Details Center, QR on Right) */}
          <div className="relative z-10 flex items-start justify-between gap-2.5 sm:gap-4 my-auto">
            
            {/* 1. Left: Cardholder Portrait Photo, DOB, and Signature Underneath */}
            <div className="flex flex-col items-center shrink-0 w-20 sm:w-24 space-y-1">
              <div className="relative w-18 h-22 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-slate-400/90 bg-white shadow-sm flex items-center justify-center">
                {frontImageUrl ? (
                  <img
                    src={frontImageUrl}
                    alt="Cardholder Photo"
                    className={`w-full h-full ${
                      isFullCardImage
                        ? "object-cover object-[16%_38%] scale-[2.2] contrast-[1.05]"
                        : "object-cover object-center"
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <User className="h-9 w-9 stroke-[1.2]" />
                    <span className="text-[7px] uppercase font-bold mt-0.5 text-slate-500">Photo</span>
                  </div>
                )}
              </div>

              {/* DOB Directly Underneath Photo (Authentic Indian PAN format) */}
              <div className="text-center w-full">
                <span className="text-[6.5px] uppercase font-bold text-slate-600 block leading-tight">
                  जन्म की तारीख / Date of Birth
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-950 font-mono tracking-wider block">
                  {dob}
                </span>
              </div>

              {/* Signature Line */}
              <div className="text-center w-full px-0.5 pt-0.5">
                <div className="border-b border-slate-800/80 pb-0.5">
                  <span className="text-[11px] sm:text-xs font-serif italic text-slate-900 tracking-wide block leading-none select-none font-bold">
                    {cardholderName.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
                <span className="text-[6.5px] uppercase font-bold text-slate-600 block mt-0.5 tracking-wider">
                  हस्ताक्षर / Signature
                </span>
              </div>
            </div>

            {/* 2. Center: Cardholder Details & Permanent Account Number */}
            <div className="flex-1 min-w-0 space-y-2 pl-1 sm:pl-2 text-left pt-1">
              <div>
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-600 block leading-tight font-serif">
                  स्थायी लेखा संख्या कार्ड / Permanent Account Number Card
                </span>
                <span className="text-base sm:text-[19px] font-mono font-black tracking-[0.22em] text-slate-950 uppercase select-all block leading-tight mt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                  {number}
                </span>
              </div>

              <div>
                <span className="text-[6.5px] sm:text-[7.5px] uppercase tracking-wider text-slate-500 font-bold block">
                  नाम / Name
                </span>
                <span className="text-xs sm:text-[13.5px] font-black text-slate-900 tracking-wide uppercase truncate block font-sans">
                  {cardholderName}
                </span>
              </div>

              <div>
                <span className="text-[6.5px] sm:text-[7.5px] uppercase tracking-wider text-slate-500 font-bold block">
                  पिता का नाम / Father's Name
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-wide uppercase truncate block font-sans">
                  {fatherName}
                </span>
              </div>
            </div>

            {/* 3. Right: Large High-Density 2D Security QR Code */}
            <div className="flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl bg-white border border-slate-300 shadow-sm shrink-0">
              <QrCode className="h-16 w-16 sm:h-20 sm:w-20 text-slate-900 stroke-[1.6]" />
              <span className="text-[7px] font-mono text-slate-600 font-bold tracking-widest mt-0.5">
                25032024
              </span>
            </div>

          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-1.5 border-t border-sky-900/15 flex items-center justify-between text-[7.5px] font-mono font-bold text-sky-950">
            <span className="tracking-widest uppercase">INCOME TAX DEPARTMENT • GOVT OF INDIA</span>
            <span className="text-sky-800">SECURE ENCRYPTED ID</span>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* DRIVING LICENSE OFFICIAL HIGH-FIDELITY DESIGN                 */}
      {/* ============================================================== */}
      {type === "DRIVING_LICENSE" && (
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: "transform 0.15s ease-out",
          }}
          className="relative w-full aspect-[1.586/1] rounded-[22px] sm:rounded-[26px] overflow-hidden border border-blue-400/50 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-4 sm:p-5 flex flex-col justify-between select-none text-slate-900 bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe]"
        >
          {/* Dynamic 3D Glare */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(96, 165, 250, 0.2) 40%, transparent 70%)`,
              opacity: glarePos.opacity,
              mixBlendMode: "overlay",
            }}
          />

          {/* Laminated PVC Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.15] to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-blue-900/15 pb-2">
            <div className="flex items-center gap-2">
              <NationalEmblemOfIndia className="h-7 w-7 text-blue-950" />
              <div>
                <span className="text-[11px] font-black text-blue-950 uppercase block leading-tight">
                  UNION OF INDIA • DRIVING LICENCE
                </span>
                <span className="text-[8.5px] font-bold text-blue-800 block">
                  {issuer || "Ministry of Road Transport & Highways"}
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
              DL-ID
            </span>
          </div>

          {/* Body */}
          <div className="relative z-10 grid grid-cols-12 gap-3 items-center my-auto">
            {/* Left: Smart Chip + DL Details */}
            <div className="col-span-8 space-y-1.5 text-left">
              {/* Gold Chip */}
              <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-600/60 p-0.5 shadow-sm flex flex-col justify-between mb-1">
                <div className="flex justify-between h-1.5">
                  <div className="w-2 h-full border-b border-r border-amber-800/40" />
                  <div className="w-2 h-full border-b border-l border-amber-800/40" />
                </div>
                <div className="h-1 w-full border-y border-amber-800/40" />
                <div className="flex justify-between h-1.5">
                  <div className="w-2 h-full border-t border-r border-amber-800/40" />
                  <div className="w-2 h-full border-t border-l border-amber-800/40" />
                </div>
              </div>

              <div>
                <span className="text-[7.5px] uppercase font-bold text-slate-600 block">Licence No.</span>
                <span className="text-sm sm:text-base font-mono font-black text-blue-950 tracking-wider block select-all">
                  {number}
                </span>
              </div>
              <div>
                <span className="text-[7.5px] uppercase font-bold text-slate-600 block">Holder Name</span>
                <span className="text-xs font-bold text-slate-900 tracking-wide uppercase truncate block">
                  {cardholderName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span>Valid: <strong>{expiry || "Permanent"}</strong></span>
                <span>RTO: <strong>{details.rto || "DL-01"}</strong></span>
              </div>
            </div>

            {/* Right: Portrait */}
            <div className="col-span-4 flex flex-col items-end">
              <div className="w-18 h-22 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-blue-900/30 bg-white shadow flex items-center justify-center">
                {frontImageUrl ? (
                  <img src={frontImageUrl} alt="Holder" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 pt-2 border-t border-blue-900/15 flex items-center justify-between text-[9px] text-blue-900">
            <span>Vehicles: <strong>{Array.isArray(details.vehicleClasses) ? details.vehicleClasses.join(", ") : "MCWG, LMV"}</strong></span>
            <span>Organ Donor: <strong>{details.organDonor ? "YES" : "NO"}</strong></span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VOTER ID OFFICIAL HIGH-FIDELITY DESIGN (EPIC)                  */}
      {/* ============================================================== */}
      {type === "VOTER_ID" && (
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: "transform 0.15s ease-out",
          }}
          className="relative w-full aspect-[1.586/1] rounded-[22px] sm:rounded-[26px] overflow-hidden border border-emerald-400/50 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-4 sm:p-5 flex flex-col justify-between select-none text-slate-900 bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]"
        >
          {/* Tricolor Ribbon on Top */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-[#ff9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          {/* Dynamic 3D Glare */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(52, 211, 153, 0.2) 40%, transparent 70%)`,
              opacity: glarePos.opacity,
              mixBlendMode: "overlay",
            }}
          />

          <div className="relative z-10 flex items-center justify-between border-b border-emerald-900/15 pb-2">
            <div className="flex items-center gap-2">
              <NationalEmblemOfIndia className="h-7 w-7 text-emerald-950" />
              <div>
                <span className="text-[11px] font-black text-emerald-950 uppercase block leading-tight">
                  ELECTION COMMISSION OF INDIA
                </span>
                <span className="text-[8.5px] font-bold text-emerald-800 block">
                  ELECTOR PHOTO IDENTITY CARD
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
              EPIC
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-12 gap-3 items-center my-auto">
            <div className="col-span-8 space-y-1 text-left">
              <div>
                <span className="text-[7.5px] uppercase font-bold text-slate-600 block">EPIC No.</span>
                <span className="text-sm sm:text-base font-mono font-black text-emerald-950 tracking-wider block select-all">
                  {number}
                </span>
              </div>
              <div>
                <span className="text-[7.5px] uppercase font-bold text-slate-600 block">Elector Name</span>
                <span className="text-xs font-bold text-slate-900 tracking-wide uppercase truncate block">
                  {cardholderName}
                </span>
              </div>
              <div>
                <span className="text-[7.5px] uppercase font-bold text-slate-600 block">Father's Name</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {fatherName}
                </span>
              </div>
            </div>
            <div className="col-span-4 flex justify-end">
              <div className="w-18 h-22 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-emerald-900/30 bg-white shadow flex items-center justify-center">
                {frontImageUrl ? (
                  <img src={frontImageUrl} alt="Holder" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-emerald-900/15 flex items-center justify-between text-[9px] text-emerald-900">
            <span>Assembly: <strong>{details.acNumber || "AC-42"}</strong></span>
            <span>Polling: <strong>{details.pollingBooth || "Booth 12A"}</strong></span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RATION CARD OFFICIAL HIGH-FIDELITY DESIGN (NFSA)               */}
      {/* ============================================================== */}
      {type === "RATION_CARD" && (
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: "transform 0.15s ease-out",
          }}
          className="relative w-full aspect-[1.586/1] rounded-[22px] sm:rounded-[26px] overflow-hidden border border-amber-400/50 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-4 sm:p-5 flex flex-col justify-between select-none text-slate-900 bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a]"
        >
          {/* Dynamic 3D Glare */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(251, 191, 36, 0.2) 40%, transparent 70%)`,
              opacity: glarePos.opacity,
              mixBlendMode: "overlay",
            }}
          />

          <div className="relative z-10 flex items-center justify-between border-b border-amber-900/15 pb-2">
            <div className="flex items-center gap-2">
              <NationalEmblemOfIndia className="h-7 w-7 text-amber-950" />
              <div>
                <span className="text-[11px] font-black text-amber-950 uppercase block leading-tight">
                  FOOD &amp; CIVIL SUPPLIES DEPARTMENT
                </span>
                <span className="text-[8.5px] font-bold text-amber-800 block">
                  NATIONAL FOOD SECURITY CARD (NFSA)
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
              RATION
            </span>
          </div>

          <div className="relative z-10 space-y-1.5 text-left my-auto">
            <div>
              <span className="text-[7.5px] uppercase font-bold text-slate-600 block">Ration Card No.</span>
              <span className="text-sm sm:text-base font-mono font-black text-amber-950 tracking-wider block select-all">
                {number}
              </span>
            </div>
            <div>
              <span className="text-[7.5px] uppercase font-bold text-slate-600 block">Head of Family</span>
              <span className="text-xs font-bold text-slate-900 uppercase block">{cardholderName}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-amber-900 pt-1">
              <span>Members: <strong>{details.familyMembersCount || 4}</strong></span>
              <span>Scheme: <strong>{details.scheme || "NFSA-PHH"}</strong></span>
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-amber-900/15 flex items-center justify-between text-[9px] text-amber-900">
            <span>Rice Quota: <strong>{details.monthlyRiceQuotaKg || 20} kg</strong></span>
            <span>Wheat Quota: <strong>{details.monthlyWheatQuotaKg || 15} kg</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
