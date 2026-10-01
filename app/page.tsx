import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  History,
  QrCode,
  ArrowRight,
  Layers,
  FileKey2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-300">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <span>Zero-Knowledge Selective Disclosure</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Your personal identity wallet.{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Share only what&apos;s needed.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Store your Driving License, PAN, Voter ID, Ration Card, and more in one client-encrypted
          vault. Disclose only minimal required claims via signed, expiring, revocable QR tokens.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="#auth"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition"
          >
            <span>Open Wallet</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/verify"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            <QrCode className="h-4 w-4 text-cyan-400" />
            <span>Verifier Portal</span>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl glass-panel p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-500/20 text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Envelope AES-256-GCM</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every document is encrypted with a unique per-user Data Encryption Key (DEK). Plaintext
            document numbers, addresses, and DOBs never touch the database or application logs.
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-500/20 text-cyan-400">
            <EyeOff className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Selective Disclosure</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Need to prove you are 18+? Disclose only an <code className="text-cyan-300 font-mono">over18: true</code> boolean claim.
            Traffic police? Disclose vehicle classes without revealing your PAN or address.
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-500/20 text-emerald-400">
            <History className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Tamper-Evident Hash Chain</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every access, link, and verification writes an entry to a SHA-256 forward hash chain.
            Verify the mathematical integrity of your audit trail at any time.
          </p>
        </div>
      </section>

      {/* Auth Portal Anchor Section */}
      <section id="auth" className="scroll-mt-24 space-y-8 max-w-lg mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Your Wallet</h2>
          <p className="text-xs text-slate-400">
            Sign up or sign in using a passwordless 6-digit email OTP or WebAuthn passkey.
          </p>
        </div>

        <AuthForm />
      </section>

      {/* DPDP Act 2023 Principles */}
      <section className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <FileKey2 className="h-6 w-6 text-indigo-400" />
          <div>
            <h3 className="text-lg font-bold text-white">DPDP Act 2023 Principles</h3>
            <p className="text-xs text-slate-400">Built from the ground up for personal privacy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
            <strong className="text-white block font-medium">1. Explicit Consent</strong>
            <span>Every share request presents a consent screen listing exact claims, duration, and audience.</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
            <strong className="text-white block font-medium">2. Purpose Limitation</strong>
            <span>Tokens specify purpose and audience. Verifiers receive only purpose-bound claims.</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
            <strong className="text-white block font-medium">3. Data Minimization</strong>
            <span>Blind indexes prevent duplicate discovery; single-use tokens auto-expire on access.</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
            <strong className="text-white block font-medium">4. Right to Erasure</strong>
            <span>Export complete decrypted wallet JSON and irreversibly erase all personal data in one click.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
