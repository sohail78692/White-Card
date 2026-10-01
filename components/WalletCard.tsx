"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { sound } from "@/lib/sound";
import { RotateCw, Shield, Wifi, AlertTriangle } from "lucide-react";

interface WalletCardProps {
  walletId: string;
  userName?: string;
  linkedDocsCount: number;
  emergencyContact?: string;
  onUpdateEmergencyContact?: (contact: string) => void;
}

export function WalletCard({
  walletId,
  userName = "Personal Wallet Holder",
  linkedDocsCount = 0,
  emergencyContact = "+91 98765 43210",
  onUpdateEmergencyContact,
}: WalletCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  // Rotating QR code on card back
  const [rotatingQrUrl, setRotatingQrUrl] = useState<string>("");
  const [qrCountdown, setQrCountdown] = useState<number>(60);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate rotating QR code for the card back
  const refreshCardQr = async () => {
    try {
      // Create a short-lived full_id share token for the card back
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: "full_id",
          purpose: "Wallet Card Back Scan",
          audience: "general",
          durationSeconds: 120, // 2 minutes
          singleUse: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const qrUrl = await QRCode.toDataURL(data.shareUrl, {
          width: 180,
          margin: 1,
          color: { dark: "#020617", light: "#ffffff" },
        });
        setRotatingQrUrl(qrUrl);
        setQrCountdown(120);
      }
    } catch {
      // Fallback QR
      try {
        const fallback = await QRCode.toDataURL(`https://whitecard.internal/w/${walletId}`, {
          width: 180,
          margin: 1,
        });
        setRotatingQrUrl(fallback);
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    refreshCardQr();
    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          refreshCardQr();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [walletId]);

  const handleFlip = () => {
    sound.playFlip();
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFlip();
    }
  };

  // Holographic reflection and 3D tilt tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.round((x / rect.width) * 100);
    const py = Math.round((y / rect.height) * 100);

    setMousePos({ x: px, y: py });

    // Subtle 3D tilt angle
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
    const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 8;
    setTilt({ rotateX, rotateY });
  };

  const handlePointerLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setMousePos({ x: 50, y: 50 });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 3D Card Stage */}
      <div
        className="w-full max-w-[420px] aspect-[1.586/1] perspective-1000 select-none cursor-pointer focus:outline-none"
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="3D White Card Wallet flip card. Press Enter or Space to flip."
        aria-pressed={isFlipped}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        ref={cardRef}
      >
        <div
          className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform rounded-2xl shadow-2xl ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transform: isFlipped
              ? `rotateY(180deg) rotateX(${tilt.rotateX}deg)`
              : `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          }}
        >
          {/* ================= CARD FRONT ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl backface-hidden overflow-hidden border border-white/20 p-5 sm:p-6 flex flex-col justify-between shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
              color: "#0f172a",
            }}
          >
            {/* Holographic Seal Dynamic Foil */}
            <div
              className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-80 pointer-events-none holographic-foil border border-white/40 shadow-sm"
              style={{
                backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
              }}
            />

            {/* Top Bar: Brand, Status Dot & NFC */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-slate-900 block leading-tight">
                    WHITE CARD WALLET
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                      ENCRYPTED
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pr-2">
                <Wifi className="h-4 w-4 text-slate-700 rotate-90" />
              </div>
            </div>

            {/* Center: SVG EMV Chip with realistic trace lines */}
            <div className="flex items-center justify-between z-10 my-1">
              <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-500/40 p-1 shadow-sm relative overflow-hidden">
                <div className="w-full h-full border border-amber-600/30 rounded flex flex-col justify-between">
                  <div className="h-px w-full bg-amber-600/40" />
                  <div className="flex justify-between w-full h-full">
                    <div className="w-1/2 border-r border-amber-600/40" />
                    <div className="w-1/2" />
                  </div>
                  <div className="h-px w-full bg-amber-600/40" />
                </div>
              </div>

              <span className="text-[10px] font-semibold text-slate-600 tracking-wider">
                {linkedDocsCount} {linkedDocsCount === 1 ? "DOCUMENT" : "DOCUMENTS"} LINKED
              </span>
            </div>

            {/* Bottom Bar: Wallet ID and User Name */}
            <div className="z-10 space-y-1">
              <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-slate-900 drop-shadow-sm">
                {walletId}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold tracking-wider uppercase">
                <span>{userName}</span>
                <span className="text-[9px] text-slate-500 font-normal">TAP TO FLIP</span>
              </div>
            </div>
          </div>

          {/* ================= CARD BACK ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl backface-hidden rotate-y-180 overflow-hidden border border-slate-700 bg-slate-900 text-white flex flex-col justify-between shadow-2xl"
          >
            {/* Magnetic Stripe */}
            <div className="w-full h-10 bg-slate-950 border-y border-white/10 mt-3" />

            {/* Center Area: Rotating QR + Details */}
            <div className="px-5 py-2 flex items-center justify-between gap-4">
              {/* Rotating QR Box */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-lg flex items-center justify-center">
                  {rotatingQrUrl ? (
                    <img src={rotatingQrUrl} alt="Card Rotating QR" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                  )}
                </div>
                <span className="text-[9px] font-mono text-cyan-400 mt-1">
                  Rotates: {qrCountdown}s
                </span>
              </div>

              {/* Emergency Contact & Notice */}
              <div className="flex-1 space-y-2 text-left">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Emergency Contact
                  </span>
                  <span className="text-xs font-mono font-bold text-white block">
                    {emergencyContact}
                  </span>
                </div>

                <div className="rounded bg-slate-950/60 p-1.5 border border-white/5">
                  <p className="text-[9px] text-slate-300 leading-tight">
                    Authorized verifiers scan QR for selective disclosure. Private cryptographic wallet.
                  </p>
                </div>
              </div>
            </div>

            {/* Microtext Line */}
            <div className="px-5 pb-3">
              <p className="text-[7.5px] uppercase tracking-tighter text-slate-500 truncate text-center">
                WHITECARD WALLET • CLIENT ENVELOPE ENCRYPTION • DPDP ACT 2023 COMPLIANT • NOT A GOVERNMENT ISSUED ID
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Accessible Flip Button */}
      <button
        type="button"
        onClick={handleFlip}
        aria-pressed={isFlipped}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm"
      >
        <RotateCw className="h-3.5 w-3.5 text-indigo-400" />
        <span>Flip Card ({isFlipped ? "Show Front" : "Show Back"})</span>
      </button>
    </div>
  );
}
