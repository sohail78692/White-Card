import React from "react";
import Link from "next/link";
import { ShieldAlert, Lock, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950 text-slate-400">
      {/* Required Disclaimer Banner */}
      <div className="border-b border-white/5 bg-slate-900/50 py-3 px-4 text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Personal document wallet – not a government-issued ID.</span>
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600">
                <Lock className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white text-sm">White Card Wallet</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A private, client-encrypted digital credential wallet. Built on principles of the
              Digital Personal Data Protection (DPDP) Act 2023: user consent, purpose limitation,
              selective disclosure, and verifiable tamper-evident audit trails.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>All documents self-declared until verified by an accredited provider</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Wallet Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/wallet" className="hover:text-white transition">
                  3D Wallet Card
                </Link>
              </li>
              <li>
                <Link href="/vault" className="hover:text-white transition">
                  Document Vault
                </Link>
              </li>
              <li>
                <Link href="/share" className="hover:text-white transition">
                  Selective Disclosure
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition">
                  Verifier Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Privacy & Security
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Audit Hash Chain
                </Link>
              </li>
              <li>
                <Link href="/privacy#export" className="hover:text-white transition">
                  Data Export (JSON)
                </Link>
              </li>
              <li>
                <Link href="/privacy#erasure" className="hover:text-white transition">
                  Right to Erasure (Delete Account)
                </Link>
              </li>
              <li>
                <Link href="/.well-known/jwks.json" className="hover:text-white transition">
                  Public JWKS
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} White Card Wallet. Zero-knowledge selective disclosure.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] text-indigo-300 border border-white/5">
              AES-256-GCM + Ed25519
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
