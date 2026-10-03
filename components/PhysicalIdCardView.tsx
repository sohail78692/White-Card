"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentType } from "@/lib/validators/documents";
import { sound } from "@/lib/sound";
import {
  RotateCw,
  Sparkles,
  Eye,
  User,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  Car,
  Bike,
  Heart,
  Wheat,
  MapPin,
  Check,
  Wifi,
  IdCard,
} from "lucide-react";

interface PhysicalIdCardViewProps {
  type: DocumentType;
  number: string;
  customTitle?: string;
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

/**
 * Photorealistic Linear Barcode SVG
 */
function RealisticBarcode({ code, className = "h-8 w-36" }: { code: string; className?: string }) {
  // Deterministic bars based on string hash
  const bars = Array.from({ length: 48 }).map((_, idx) => {
    const charCode = code.charCodeAt(idx % code.length) || 65;
    const isThick = (charCode + idx * 7) % 3 === 0;
    const isMedium = (charCode + idx * 3) % 2 === 0;
    return isThick ? 3 : isMedium ? 1.8 : 0.9;
  });

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
        {bars.map((w, idx) => {
          const x = idx * 2.05;
          return <rect key={idx} x={x} y="0" width={w} height="24" fill="#0f172a" />;
        })}
      </svg>
      <span className="text-[7px] font-mono tracking-widest text-slate-800 uppercase mt-0.5 font-bold">
        *{code}*
      </span>
    </div>
  );
}

export function PhysicalIdCardView({
  type,
  number,
  customTitle,
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
    const rotX = ((y - centerY) / centerY) * -6;
    const rotY = ((x - centerX) / centerX) * 6;
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

  const handleFlip = () => {
    sound.playFlip();
    setIsFlipped(!isFlipped);
  };

  const cardholderName =
    name || details.name || details.fullName || details.cardholderName || "SOHAIL AKHTAR";
  const fatherName = details.fatherName || details.fathersName || "SAHIMUDDIN ANSARI";
  const dob = details.dob || details.dateOfBirth || "10/01/2006";
  const bloodGroup = details.bloodGroup || "O+";
  const organDonor = details.organDonor ?? true;
  const stateName = details.state || details.issueState || (type === "DRIVING_LICENSE" ? "Delhi" : "New Delhi");
  const rtoCode = details.rto || (number.length >= 4 ? number.slice(0, 4) : "DL-01");

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
                onClick={handleFlip}
                className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1 text-[11px] font-semibold text-sky-300 border border-white/10 transition active:scale-95"
              >
                <RotateCw className="h-3 w-3" />
                <span>Show {isFlipped ? "Front" : "Back"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setViewMode("card");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1 text-[11px] font-semibold text-neutral-300 border border-white/10 transition active:scale-95"
            >
              <span>Digital 3D View</span>
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

  // Realistic Digital Card Replica with 3D Flip (Front & Back)
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Official PVC Card ({isFlipped ? "Back View" : "Front View"})
          </span>
          <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline-block">
            ISO/IEC 7810 ID-1
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Flip Card Button */}
          <button
            type="button"
            onClick={handleFlip}
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 px-3.5 py-1 text-[11px] font-bold transition active:scale-95 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            title="Flip to opposite side of card"
          >
            <RotateCw className={`h-3 w-3 text-sky-300 transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`} />
            <span>Flip to {isFlipped ? "Front" : "Back"}</span>
          </button>

          {frontImageUrl && (
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setViewMode("photo");
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1 text-[11px] font-semibold text-neutral-300 border border-white/10 transition active:scale-95"
            >
              <Eye className="h-3 w-3 text-neutral-300" />
              <span>Real Photo</span>
            </button>
          )}
        </div>
      </div>

      {/* Prompt to upload photo if empty */}
      {!frontImageUrl && !backImageUrl && onUploadPhoto && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-950/60 to-blue-950/60 border border-sky-400/25 p-2.5 px-3 text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="text-[11px]">Upload your physical card photo anytime to switch between digital &amp; scan view</span>
          </div>
          <button
            type="button"
            onClick={onUploadPhoto}
            className="rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 px-3 py-1 text-[11px] font-bold transition active:scale-95 shrink-0 shadow ml-2"
          >
            Upload Scan
          </button>
        </div>
      )}

      {/* 3D Interactive Card Stage with 3D Flip */}
      <div
        className="w-full perspective-1000 select-none cursor-pointer"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
        aria-label="Interactive 3D PVC ID Card. Press space or click to flip."
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`relative w-full aspect-[1.586/1] duration-700 transform-style-preserve-3d transition-transform rounded-[22px] sm:rounded-[26px] shadow-[0_25px_60px_rgba(0,0,0,0.85)] ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transform: isFlipped
              ? `rotateY(180deg) rotateX(${rotateX}deg)`
              : `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          }}
        >
          {/* ============================================================== */}
          {/* 1. PAN CARD (PERMANENT ACCOUNT NUMBER)                         */}
          {/* ============================================================== */}
          {type === "PAN" && (
            <>
              {/* PAN FRONT */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] backface-hidden overflow-hidden border border-sky-300/80 p-3.5 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#d4ecfd] via-[#e8f5fe] to-[#bde1f9] shadow-2xl">
                {/* Guilloche Security Pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.16] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="pan-pat" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 20 Q 10 0, 20 20 T 40 20" fill="none" stroke="#0284c7" strokeWidth="0.6" />
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#0ea5e9" strokeWidth="0.4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#pan-pat)" />
                </svg>

                {/* Lion Capital Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.065] pointer-events-none">
                  <NationalEmblemOfIndia className="h-52 w-52 text-sky-950" />
                </div>

                {/* Dynamic 3D Glare */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                  style={{
                    background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(253, 224, 71, 0.15) 25%, rgba(56, 189, 248, 0.2) 50%, transparent 70%)`,
                    opacity: glarePos.opacity,
                    mixBlendMode: "overlay",
                  }}
                />

                {/* Top Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-sky-900/20 pb-2">
                  <div className="leading-tight text-left">
                    <span className="text-[10px] sm:text-[12px] font-black tracking-wider text-slate-900 uppercase block font-serif">
                      आयकर विभाग
                    </span>
                    <span className="text-[7.5px] sm:text-[8.5px] font-extrabold text-slate-800 tracking-wide uppercase block">
                      INCOME TAX DEPARTMENT
                    </span>
                  </div>

                  <NationalEmblemOfIndia className="h-7 w-7 sm:h-8 sm:w-8 text-slate-900 drop-shadow-sm" />

                  <div className="flex items-center gap-2 text-right">
                    <div className="leading-tight">
                      <span className="text-[10px] sm:text-[12px] font-black tracking-wider text-slate-900 uppercase block font-serif">
                        भारत सरकार
                      </span>
                      <span className="text-[7.5px] sm:text-[8.5px] font-extrabold text-slate-800 tracking-wide uppercase block">
                        GOVT. OF INDIA
                      </span>
                    </div>
                    {/* Metallic Hologram */}
                    <div className="relative h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-tr from-[#fcd34d] via-[#6ee7b7] via-[#c084fc] to-[#38bdf8] shadow border border-amber-200/90 flex items-center justify-center overflow-hidden shrink-0">
                      <span className="text-[6px] font-black text-slate-800 uppercase tracking-tighter">ITD</span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="relative z-10 flex items-start justify-between gap-2.5 sm:gap-4 my-auto">
                  {/* Photo & DOB */}
                  <div className="flex flex-col items-center shrink-0 w-20 sm:w-24 space-y-1">
                    <div className="relative w-18 h-22 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-slate-400/90 bg-white shadow-sm flex items-center justify-center">
                      {frontImageUrl ? (
                        <img
                          src={frontImageUrl}
                          alt="Cardholder Photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <User className="h-9 w-9 stroke-[1.2]" />
                          <span className="text-[7px] uppercase font-bold mt-0.5 text-slate-500">Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <span className="text-[6.5px] uppercase font-bold text-slate-600 block leading-tight">
                        जन्म की तारीख / DOB
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-950 font-mono tracking-wider block">
                        {dob}
                      </span>
                    </div>
                    <div className="text-center w-full px-0.5 pt-0.5">
                      <div className="border-b border-slate-800/80 pb-0.5">
                        <span className="text-[11px] sm:text-xs font-serif italic text-slate-900 tracking-wide block leading-none font-bold">
                          {cardholderName.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                      <span className="text-[6.5px] uppercase font-bold text-slate-600 block mt-0.5 tracking-wider">
                        हस्ताक्षर / Signature
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-2 pl-1 sm:pl-2 text-left pt-1">
                    <div>
                      <span className="text-[7px] sm:text-[8px] font-bold text-slate-600 block leading-tight font-serif">
                        स्थायी लेखा संख्या कार्ड / Permanent Account Number
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
                        पिता का नाम / Father&apos;s Name
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-wide uppercase truncate block font-sans">
                        {fatherName}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-700/15 border border-emerald-700/30 px-2 py-0.5 text-[8.5px] font-bold text-emerald-900">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-700" />
                        <span>Active &amp; Aadhaar Linked</span>
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl bg-white border border-slate-300 shadow-sm shrink-0">
                    <QrCode className="h-16 w-16 sm:h-20 sm:w-20 text-slate-900 stroke-[1.6]" />
                    <span className="text-[7px] font-mono text-slate-600 font-bold tracking-widest mt-0.5">
                      ITD-VERIFIED
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 pt-1.5 border-t border-sky-900/15 flex items-center justify-between text-[7.5px] font-mono font-bold text-sky-950">
                  <span className="tracking-widest uppercase">INCOME TAX DEPARTMENT • GOVT OF INDIA</span>
                  <span className="text-sky-800">TAP CARD TO FLIP BACK ➔</span>
                </div>
              </div>

              {/* PAN BACK */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] rotate-y-180 backface-hidden overflow-hidden border border-sky-300/80 p-3.5 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#bae6fd] shadow-2xl">
                {/* Guilloche */}
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
                  <NationalEmblemOfIndia className="h-full w-full mx-auto text-sky-900" />
                </div>

                {/* Top Hologram Strip */}
                <div className="relative z-10 w-full h-7 rounded-md bg-gradient-to-r from-amber-200 via-emerald-200 via-sky-300 to-amber-200 border border-slate-300 flex items-center justify-around px-2 text-[7px] font-mono font-bold text-slate-800 tracking-wider shadow-inner">
                  <span>★ GOVT OF INDIA</span>
                  <span>INCOME TAX DEPARTMENT</span>
                  <span>GOVT OF INDIA ★</span>
                </div>

                {/* Back Advisory & Return Notice */}
                <div className="relative z-10 space-y-2 text-left my-auto px-1">
                  <div className="text-[8.5px] sm:text-[9.5px] text-slate-800 font-medium leading-relaxed space-y-1">
                    <p className="font-bold text-slate-950 font-serif">
                      इस कार्ड के खोने/पाने पर कृपया सूचित करें / If found, please return to:
                    </p>
                    <p className="font-mono text-[8px] sm:text-[9px] text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-300 leading-snug">
                      Income Tax PAN Services Unit, Protean / NSDL e-Gov,<br />
                      5th Floor, Mantri Sterling, Plot No. 341, Survey No. 997/8,<br />
                      Model Colony, Near Deep Bungalow Chowk, Pune - 411 016.<br />
                      Helpline: 020-27218080 • Email: tininfo@proteantech.in
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <RealisticBarcode code={number} className="h-7 w-44" />
                    <div className="text-right text-[8px] font-mono text-slate-700">
                      <div>CARD STATUS: <strong>ACTIVE</strong></div>
                      <div>TAX CATEGORY: <strong>INDIVIDUAL</strong></div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 pt-1.5 border-t border-sky-900/15 flex items-center justify-between text-[7.5px] font-mono font-bold text-sky-950">
                  <span>OFFICIAL DIGITAL CREDENTIAL • WHITE CARD</span>
                  <span className="text-sky-800">TAP TO FLIP FRONT ➔</span>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 2. DRIVING LICENSE                                             */}
          {/* ============================================================== */}
          {type === "DRIVING_LICENSE" && (
            <>
              {/* DL FRONT */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] backface-hidden overflow-hidden border border-blue-400/50 shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe]">
                {/* Dynamic 3D Glare */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                  style={{
                    background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(96, 165, 250, 0.2) 40%, transparent 70%)`,
                    opacity: glarePos.opacity,
                    mixBlendMode: "overlay",
                  }}
                />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-blue-900/15 pb-2">
                  <div className="flex items-center gap-2">
                    <NationalEmblemOfIndia className="h-7 w-7 text-blue-950" />
                    <div className="text-left">
                      <span className="text-[11px] font-black text-blue-950 uppercase block leading-tight">
                        UNION OF INDIA • DRIVING LICENCE
                      </span>
                      <span className="text-[8.5px] font-bold text-blue-800 block">
                        {issuer || "Ministry of Road Transport & Highways"} • {stateName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                    FORM 7 • SMART ID
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
                    <div className="flex items-center gap-3 text-[10px] text-slate-800">
                      <span>DOB: <strong>{dob}</strong></span>
                      <span>Blood Group: <strong>{bloodGroup}</strong></span>
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
                    <span className="text-[7.5px] font-mono text-blue-950 font-bold mt-1">
                      RTO: {rtoCode}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 pt-2 border-t border-blue-900/15 flex items-center justify-between text-[9px] text-blue-900">
                  <span>Vehicles: <strong>{Array.isArray(details.vehicleClasses) ? details.vehicleClasses.join(", ") : "MCWG, LMV"}</strong></span>
                  <span>Valid Until: <strong>{expiry || "2042-10-18"}</strong></span>
                  <span className="text-[8px] font-bold text-blue-700">TAP TO FLIP ➔</span>
                </div>
              </div>

              {/* DL BACK */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] rotate-y-180 backface-hidden overflow-hidden border border-blue-400/50 shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#bfdbfe]">
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-blue-900/15 pb-1.5 text-left">
                  <span className="text-[10px] font-extrabold text-blue-950 uppercase">
                    Vehicle Class Authorization &amp; Endorsements
                  </span>
                  <span className="text-[8px] font-mono text-blue-800">
                    PARIVAHAN SARATHI COMPLIANT
                  </span>
                </div>

                {/* Vehicle Classes Grid */}
                <div className="relative z-10 space-y-2 text-left my-auto">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-200 flex items-center gap-2">
                      <Bike className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-900">MCWG</div>
                        <div className="text-[8px] text-slate-600 leading-tight">Motorcycle with Gear</div>
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-200 flex items-center gap-2">
                      <Car className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-900">LMV</div>
                        <div className="text-[8px] text-slate-600 leading-tight">Light Motor Vehicle (Car)</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/70 p-2 rounded-xl border border-blue-200 text-[9px] text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                      <span>Organ Donor: <strong>{organDonor ? "PLEDGED (YES)" : "NO"}</strong></span>
                    </div>
                    <div>Blood Group: <strong>{bloodGroup}</strong></div>
                    <div>Emergency: <strong>112 / Parivahan</strong></div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <RealisticBarcode code={number} className="h-7 w-40" />
                    <div className="flex items-center gap-2">
                      <QrCode className="h-8 w-8 text-blue-950" />
                      <div className="text-[7.5px] font-mono text-slate-700 text-right">
                        <div>DIGITAL VERIFIED</div>
                        <div>RTO: {rtoCode}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 pt-1.5 border-t border-blue-900/15 flex items-center justify-between text-[7.5px] font-mono font-bold text-blue-950">
                  <span>ISSUING AUTHORITY: LICENSING AUTHORITY, {stateName.toUpperCase()}</span>
                  <span className="text-blue-800">TAP TO FLIP FRONT ➔</span>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 3. VOTER ID (EPIC)                                             */}
          {/* ============================================================== */}
          {type === "VOTER_ID" && (
            <>
              {/* VOTER FRONT */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] backface-hidden overflow-hidden border border-emerald-400/50 shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]">
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
                    <div className="text-left">
                      <span className="text-[11px] font-black text-emerald-950 uppercase block leading-tight font-serif">
                        भारत निर्वाचन आयोग • ELECTION COMMISSION OF INDIA
                      </span>
                      <span className="text-[8.5px] font-bold text-emerald-800 block">
                        ELECTOR PHOTO IDENTITY CARD (EPIC)
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-700 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                    EPIC
                  </span>
                </div>

                <div className="relative z-10 grid grid-cols-12 gap-3 items-center my-auto">
                  <div className="col-span-8 space-y-1 text-left">
                    <div>
                      <span className="text-[7.5px] uppercase font-bold text-slate-600 block">पहचान पत्र क्र. / EPIC No.</span>
                      <span className="text-sm sm:text-base font-mono font-black text-emerald-950 tracking-wider block select-all">
                        {number}
                      </span>
                    </div>
                    <div>
                      <span className="text-[7.5px] uppercase font-bold text-slate-600 block">निर्वाचक का नाम / Elector Name</span>
                      <span className="text-xs font-bold text-slate-900 tracking-wide uppercase truncate block">
                        {cardholderName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[7.5px] uppercase font-bold text-slate-600 block">पिता का नाम / Father&apos;s Name</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {fatherName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-emerald-950 pt-0.5">
                      <span>Gender: <strong>Male</strong></span>
                      <span>DOB: <strong>{dob}</strong></span>
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
                  <span>Assembly: <strong>{details.acNumber || "AC-42 New Delhi"}</strong></span>
                  <span>Polling: <strong>{details.pollingBooth || "Booth 12A"}</strong></span>
                  <span className="text-[8px] font-bold text-emerald-700">TAP TO FLIP ➔</span>
                </div>
              </div>

              {/* VOTER BACK */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] rotate-y-180 backface-hidden overflow-hidden border border-emerald-400/50 shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#d1fae5] via-[#ecfdf5] to-[#a7f3d0]">
                <div className="relative z-10 flex items-center justify-between border-b border-emerald-900/15 pb-1.5 text-left">
                  <span className="text-[10px] font-extrabold text-emerald-950 uppercase font-serif">
                    निर्वाचक रजिस्ट्रीकरण अधिकारी / ELECTORAL REGISTRATION OFFICER
                  </span>
                  <span className="text-[8px] font-mono text-emerald-800">
                    ECI VERIFIED
                  </span>
                </div>

                <div className="relative z-10 space-y-2 text-left my-auto px-1">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 space-y-1 text-[9px] text-slate-800">
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">पता / Address</span>
                      <p className="font-sans leading-snug">
                        House No. 42, Sector 3, Connaught Place, New Delhi, Delhi - 110001
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100 text-[8.5px]">
                      <div>Constituency: <strong>{details.parliamentaryConstituency || "04 New Delhi"}</strong></div>
                      <div>Part No &amp; Serial: <strong>{details.partSerial || "24/110"}</strong></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <RealisticBarcode code={number} className="h-7 w-40" />
                    <div className="flex items-center gap-2">
                      <QrCode className="h-8 w-8 text-emerald-950" />
                      <div className="text-[7.5px] font-mono text-slate-700 text-right">
                        <div>ERO SIGNED</div>
                        <div>ECI REGISTRY</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-1.5 border-t border-emerald-900/15 flex items-center justify-between text-[7.5px] font-mono font-bold text-emerald-950">
                  <span>ELECTOR PHOTO IDENTITY CARD • GOVT OF INDIA</span>
                  <span className="text-emerald-800">TAP TO FLIP FRONT ➔</span>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 4. RATION CARD (NFSA)                                          */}
          {/* ============================================================== */}
          {type === "RATION_CARD" && (
            <>
              {/* RATION FRONT */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] backface-hidden overflow-hidden border border-amber-400/50 shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a]">
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
                    <div className="text-left">
                      <span className="text-[11px] font-black text-amber-950 uppercase block leading-tight font-serif">
                        खाद्य एवं नागरिक आपूर्ति विभाग • FOOD &amp; CIVIL SUPPLIES
                      </span>
                      <span className="text-[8.5px] font-bold text-amber-800 block">
                        NATIONAL FOOD SECURITY CARD (NFSA)
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                    {details.category || "NFSA-BPL"}
                  </span>
                </div>

                <div className="relative z-10 space-y-1.5 text-left my-auto">
                  <div>
                    <span className="text-[7.5px] uppercase font-bold text-slate-600 block">राशन कार्ड संख्या / Ration Card No.</span>
                    <span className="text-sm sm:text-base font-mono font-black text-amber-950 tracking-wider block select-all">
                      {number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[7.5px] uppercase font-bold text-slate-600 block">परिवार का मुखिया / Head of Family</span>
                    <span className="text-xs font-bold text-slate-900 uppercase block">{cardholderName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-amber-900 pt-1">
                    <span>Members: <strong>{details.familyMembersCount || 4} Beneficiaries</strong></span>
                    <span>FPS Depot: <strong>{details.fpsDepotId || "FPS-9842"}</strong></span>
                  </div>
                </div>

                <div className="relative z-10 pt-2 border-t border-amber-900/15 flex items-center justify-between text-[9px] text-amber-900">
                  <span>Rice: <strong>{details.monthlyRiceQuotaKg || 20} kg</strong></span>
                  <span>Wheat: <strong>{details.monthlyWheatQuotaKg || 15} kg</strong></span>
                  <span className="text-[8px] font-bold text-amber-800">TAP TO FLIP ➔</span>
                </div>
              </div>

              {/* RATION BACK */}
              <div className="absolute inset-0 w-full h-full rounded-[22px] sm:rounded-[26px] rotate-y-180 backface-hidden overflow-hidden border border-amber-400/50 shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#fef3c7] via-[#fffbeb] to-[#fde68a]">
                <div className="relative z-10 flex items-center justify-between border-b border-amber-900/15 pb-1.5 text-left">
                  <span className="text-[10px] font-extrabold text-amber-950 uppercase font-serif">
                    परिवार के सदस्यों का विवरण / REGISTERED FAMILY BENEFICIARIES
                  </span>
                  <span className="text-[8px] font-mono text-amber-800">
                    NFSA PORTAL LINKED
                  </span>
                </div>

                <div className="relative z-10 space-y-1.5 text-left my-auto px-1">
                  <div className="bg-white/80 rounded-xl border border-amber-200 overflow-hidden text-[8.5px]">
                    <div className="grid grid-cols-4 bg-amber-100/70 p-1.5 font-bold text-amber-950">
                      <div>Name</div>
                      <div>Relation</div>
                      <div>Age</div>
                      <div>Aadhaar</div>
                    </div>
                    <div className="divide-y divide-amber-100 text-slate-800">
                      <div className="grid grid-cols-4 p-1.5">
                        <div className="font-semibold truncate">{cardholderName}</div>
                        <div>Head</div>
                        <div>38</div>
                        <div className="text-emerald-700 font-bold">✓ Linked</div>
                      </div>
                      <div className="grid grid-cols-4 p-1.5">
                        <div className="font-semibold truncate">Fatima Ansari</div>
                        <div>Spouse</div>
                        <div>34</div>
                        <div className="text-emerald-700 font-bold">✓ Linked</div>
                      </div>
                      <div className="grid grid-cols-4 p-1.5">
                        <div className="font-semibold truncate">Zaid Ansari</div>
                        <div>Son</div>
                        <div>12</div>
                        <div className="text-emerald-700 font-bold">✓ Linked</div>
                      </div>
                      <div className="grid grid-cols-4 p-1.5">
                        <div className="font-semibold truncate">Aisha Ansari</div>
                        <div>Daughter</div>
                        <div>9</div>
                        <div className="text-emerald-700 font-bold">✓ Linked</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <RealisticBarcode code={number} className="h-7 w-40" />
                    <div className="flex items-center gap-1.5 text-amber-950">
                      <Wheat className="h-4 w-4 text-amber-600" />
                      <span className="text-[8px] font-bold">Subsidized Food Grain Entitlement</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-1.5 border-t border-amber-900/15 flex items-center justify-between text-[7.5px] font-mono font-bold text-amber-950">
                  <span>NFSA • ONE NATION ONE RATION CARD (ONORC)</span>
                  <span className="text-amber-800">TAP TO FLIP FRONT ➔</span>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* ==================== 5. RANDOM / CUSTOM CARD ================= */}
          {/* ============================================================== */}
          {type === "RANDOM" && (
            <>
              {/* RANDOM FRONT */}
              <div
                className={`absolute inset-0 rounded-[22px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-2xl border border-pink-500/30 backface-hidden ${
                  isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
                style={{
                  background: "linear-gradient(135deg, #18181b 0%, #111115 45%, #1e1122 100%)",
                  boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                }}
              >
                {/* Holographic Security Overlay Pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(236,72,153,0.25) 0%, transparent 60%), linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%)`,
                    backgroundSize: "100% 100%, 16px 16px",
                  }}
                />

                {/* Top Header */}
                <div className="relative z-10 flex items-start justify-between border-b border-pink-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
                      <IdCard className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-white drop-shadow-sm">
                        {customTitle || details.title || "CUSTOM IDENTITY CARD"}
                      </h4>
                      <p className="text-[8px] font-mono text-pink-300 font-semibold tracking-widest uppercase">
                        {issuer || "UNIVERSAL SOVEREIGN PASS"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7.5px] font-mono font-bold bg-pink-500/20 border border-pink-500/40 text-pink-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      AES-256-GCM
                    </span>
                    <span className="text-[7px] text-neutral-400 font-mono mt-0.5">
                      {expiry ? `EXP: ${expiry}` : "PERMANENT"}
                    </span>
                  </div>
                </div>

                {/* Body with EMV Chip & ID Info */}
                <div className="relative z-10 grid grid-cols-[auto_1fr] gap-3 items-center my-auto py-1">
                  <div className="space-y-1.5 shrink-0">
                    <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-600/60 p-0.5 shadow-sm flex flex-col justify-between">
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
                    <div className="flex items-center gap-1 justify-center text-neutral-400">
                      <Wifi className="h-3 w-3 rotate-90" />
                      <span className="text-[7px] font-mono">NFC</span>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="text-[8px] font-mono text-neutral-400 tracking-wider uppercase">
                      Document Number
                    </div>
                    <div className="text-base sm:text-lg font-mono font-extrabold text-white tracking-widest drop-shadow select-all truncate">
                      {number}
                    </div>
                    <div className="text-xs font-bold text-pink-100 uppercase tracking-wide truncate">
                      {cardholderName}
                    </div>
                    {details.notes && (
                      <div className="text-[8.5px] text-neutral-300 truncate max-w-[200px]">
                        {details.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="relative z-10 pt-1.5 border-t border-white/10 flex items-center justify-between text-[7.5px] font-mono text-neutral-400">
                  <span className="text-pink-300 font-semibold">SOVEREIGN CREDENTIAL</span>
                  <span className="text-neutral-400">TAP CARD TO FLIP ➔</span>
                </div>
              </div>

              {/* RANDOM BACK */}
              <div
                className={`absolute inset-0 rounded-[22px] p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-2xl border border-pink-500/30 backface-hidden ${
                  !isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
                style={{
                  background: "linear-gradient(135deg, #111115 0%, #18181b 50%, #1e1122 100%)",
                  transform: "rotateY(180deg)",
                  boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                }}
              >
                {/* Magnetic Stripe */}
                <div className="absolute top-3 left-0 right-0 h-8 bg-black/90 border-y border-white/10" />

                <div className="pt-9 space-y-2 relative z-10">
                  {/* Signature strip */}
                  <div className="bg-white/90 rounded-md p-1.5 flex items-center justify-between">
                    <span className="text-[7.5px] font-mono font-bold text-neutral-800">
                      AUTHORIZED SIGNATURE
                    </span>
                    <span className="text-[9px] font-serif italic text-neutral-900 font-bold px-2">
                      {cardholderName}
                    </span>
                  </div>

                  {/* Attributes list */}
                  <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-neutral-300 bg-white/[0.04] p-2 rounded-xl border border-white/5">
                    <div>
                      <span className="text-neutral-500 block">ISSUER</span>
                      <span className="font-bold text-white truncate block">{issuer || "Self-Issued"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">STATUS</span>
                      <span className="font-bold text-emerald-400">ACTIVE & VERIFIED</span>
                    </div>
                    {Object.entries(details).slice(0, 2).map(([k, v]) => (
                      <div key={k} className="truncate">
                        <span className="text-neutral-500 uppercase block">{k}</span>
                        <span className="font-bold text-white truncate block">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 pt-1 border-t border-white/10 flex items-center justify-between text-[7.5px] font-mono text-neutral-400">
                  <span>ENCRYPTED CLIENT-SIDE WITH DEK</span>
                  <span className="text-pink-300 font-bold">TAP TO FLIP FRONT ➔</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
