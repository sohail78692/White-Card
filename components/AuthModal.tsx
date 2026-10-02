"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, KeyRound } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";
import { sound } from "@/lib/sound";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isOpen) return;

    // Lock body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sound.playPop();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="auth-modal-backdrop fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-2xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playPop();
          onClose();
        }
      }}
    >
      {/* Modal Card */}
      <div className="auth-modal-card relative w-full max-w-md rounded-[24px] bg-[#0a0a0c] border border-white/[0.08] p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.95)] space-y-5">
        {/* Top Header & Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-bold text-white tracking-wide uppercase">
                Access Your Wallet
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Passwordless Email Verification
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            aria-label="Close authentication modal"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-500 hover:text-white hover:bg-white/[0.1] transition-all duration-150 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AuthForm Content */}
        <div>
          <AuthForm onSuccess={() => {
            onClose();
            window.location.href = "/wallet";
          }} />
        </div>
      </div>
    </div>,
    document.body
  );
}
