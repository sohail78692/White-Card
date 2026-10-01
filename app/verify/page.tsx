"use client";

import React, { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { sound } from "@/lib/sound";
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Wheat,
  Vote,
  Car,
  Building,
  Key,
  Copy,
  Check,
  Loader2,
  Lock,
} from "lucide-react";

export default function VerifierPortalPage() {
  const [activeTab, setActiveTab] = useState<"scan" | "register">("scan");
  const [role, setRole] = useState<"police" | "fps" | "polling" | "bank" | "general">("general");

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification result state
  const [result, setResult] = useState<any>(null);

  // FPS Dispense Form state
  const [riceToDispense, setRiceToDispense] = useState<number>(5);
  const [wheatToDispense, setWheatToDispense] = useState<number>(5);
  const [dispenseLoading, setDispenseLoading] = useState(false);
  const [dispenseMsg, setDispenseMsg] = useState<string | null>(null);

  // Polling Checkin state
  const [electionId, setElectionId] = useState("GEN-ELECTION-2026");
  const [pollLoading, setPollLoading] = useState(false);
  const [pollMsg, setPollMsg] = useState<string | null>(null);

  // Registration state
  const [regName, setRegName] = useState("");
  const [regType, setRegType] = useState<string>("police");
  const [regEmail, setRegEmail] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [issuedApiKey, setIssuedApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop camera on unmount or when scanning ends
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        setScanning(true);
        sound.playTone(500, "sine", 0.08);
        requestAnimationFrame(tick);
      }
    } catch {
      setError("Unable to access camera. Please allow camera permissions or paste the share link below.");
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            sound.playScan();
            stopCamera();
            setTokenInput(code.data);
            handleVerify(code.data);
            return;
          }
        }
      }
    }
    if (streamRef.current) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const handleVerify = async (tokenOrUrl: string) => {
    if (!tokenOrUrl) return;
    setVerifying(true);
    setError(null);
    setResult(null);
    setDispenseMsg(null);
    setPollMsg(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (issuedApiKey) {
        headers["x-api-key"] = issuedApiKey;
      }
      headers["x-verifier-type"] = role;

      const res = await fetch("/api/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ token: tokenOrUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Verification failed");
      } else {
        if (data.valid) {
          sound.playSuccess();
        } else {
          sound.playError();
        }
        setResult(data);
      }
    } catch {
      sound.playError();
      setError("Network error contacting verification service");
    } finally {
      setVerifying(false);
    }
  };

  const handleDispense = async () => {
    if (!result?.claims?.documentId) {
      setError("Missing ration document reference in claims");
      return;
    }

    setDispenseLoading(true);
    setDispenseMsg(null);

    try {
      const res = await fetch("/api/verify/ration/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: result.claims.documentId,
          qtyRice: Number(riceToDispense),
          qtyWheat: Number(wheatToDispense),
          verifierId: "FPS-Depot-Official",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Dispense transaction rejected");
      } else {
        sound.playSuccess();
        setDispenseMsg(`Successfully dispensed: ${riceToDispense}kg Rice, ${wheatToDispense}kg Wheat.`);
        // Update claims balance locally
        setResult((prev: any) => ({
          ...prev,
          claims: {
            ...prev.claims,
            remainingRiceKg: data.remainingRiceKg,
            remainingWheatKg: data.remainingWheatKg,
          },
        }));
      }
    } catch {
      sound.playError();
      setError("Network error executing ration transaction");
    } finally {
      setDispenseLoading(false);
    }
  };

  const handlePollCheckin = async () => {
    if (!result?.subject) {
      setError("Missing voter wallet ID in claims");
      return;
    }

    setPollLoading(true);
    setPollMsg(null);

    try {
      const res = await fetch("/api/verify/polling/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: result.subject,
          electionId,
          verifierId: "Polling Officer Station #42",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Check-in rejected: Voter already marked as checked in.");
      } else {
        sound.playSuccess();
        setPollMsg("Voter eligibility confirmed! Marked as checked in for ballot issuance.");
      }
    } catch {
      sound.playError();
      setError("Network error recording voter check-in");
    } finally {
      setPollLoading(false);
    }
  };

  const handleRegisterVerifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verifier/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          type: regType,
          contactEmail: regEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Failed to register verifier");
      } else {
        sound.playSuccess();
        setIssuedApiKey(data.apiKey);
      }
    } catch {
      sound.playError();
      setError("Network error registering verifier");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Verifier & Inspector Portal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scan and verify Ed25519 tokens with role-specific views and atomic transactions.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab("scan")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "scan"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Scanner & Roles
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "register"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Register Org / API Key
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {dispenseMsg && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{dispenseMsg}</span>
        </div>
      )}

      {pollMsg && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{pollMsg}</span>
        </div>
      )}

      {activeTab === "scan" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Scanner & Token Input (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Verifier Role
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">Role Views</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "general", label: "General", icon: Building },
                  { id: "police", label: "Traffic Police", icon: Car },
                  { id: "fps", label: "Fair Price Shop", icon: Wheat },
                  { id: "polling", label: "Polling Officer", icon: Vote },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setRole(item.id as any)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                        role === item.id
                          ? "border-cyan-500/50 bg-cyan-950/30 text-white font-medium shadow-sm"
                          : "border-white/5 bg-slate-900/60 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${role === item.id ? "text-cyan-400" : ""}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Camera Scanner View */}
              <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950 relative min-h-[220px] flex items-center justify-center">
                <video ref={videoRef} className={`w-full h-auto object-cover ${scanning ? "block" : "hidden"}`} />
                <canvas ref={canvasRef} className="hidden" />

                {!scanning ? (
                  <div className="text-center p-6 space-y-3">
                    <Camera className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Camera inactive. Click to scan QR token.</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 transition"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Start Web Scanner</span>
                    </button>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-lg bg-slate-900/80 p-2 text-white hover:bg-slate-800 transition"
                      aria-label="Stop Camera"
                    >
                      <CameraOff className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Link/Token Fallback */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Or Paste Share Link / Token:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="http://localhost:3000/v/eyJhbGciOi..."
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerify(tokenInput)}
                    disabled={verifying || !tokenInput}
                    className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-50 transition shrink-0"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Role-Specific Specialized Verification Result (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {!result ? (
              <div className="rounded-2xl glass-panel p-12 text-center space-y-3 border border-white/10 min-h-[380px] flex flex-col items-center justify-center">
                <ShieldCheck className="h-12 w-12 text-slate-600" />
                <h3 className="text-base font-semibold text-white">Awaiting Verification Scan</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Point camera at a citizen&apos;s White Card QR code, or paste the share link. Disclosed claims will be rendered here.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
                {/* Status Bar */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    {result.status === "Valid" ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {result.status === "Valid" ? "Token Verified Valid" : `Status: ${result.status}`}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Subject: <strong className="font-mono text-slate-200">{result.subject || "Unknown"}</strong>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${
                      result.status === "Valid"
                        ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                        : "bg-red-950/60 text-red-300 border-red-500/30"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                {/* ROLE VIEW 1: Traffic Police */}
                {role === "police" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                      <Car className="h-4 w-4" />
                      <span>Traffic Police Inspector View</span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-slate-400">Driving License Status:</span>
                        <span
                          className={`font-bold ${
                            result.claims?.drivingLicenseValid ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {result.claims?.drivingLicenseValid ? "VALID & ACTIVE" : "EXPIRED / SUSPENDED"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Authorized Vehicle Classes:</span>
                        <strong className="text-white font-mono text-sm">
                          {Array.isArray(result.claims?.vehicleClasses)
                            ? result.claims?.vehicleClasses.join(", ")
                            : "—"}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Expiry Date:</span>
                        <span className="text-slate-200">{String(result.claims?.expiryDate || "—")}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Organ Donor Consent:</span>
                        <span className="text-slate-200">{result.claims?.organDonor ? "Yes" : "No"}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-900/40 p-3 border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Privacy Guard: PAN, residential address, and unmasked DL numbers are protected.</span>
                    </div>
                  </div>
                )}

                {/* ROLE VIEW 2: Fair Price Shop (FPS) Ration Dispense */}
                {role === "fps" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                      <Wheat className="h-4 w-4" />
                      <span>Fair Price Shop (FPS) Ration Dispense</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-900/80 p-3 border border-white/5">
                        <span className="text-[10px] text-slate-400 block">Remaining Rice Balance</span>
                        <strong className="text-xl text-emerald-400 font-mono">
                          {String(result.claims?.remainingRiceKg ?? "—")} kg
                        </strong>
                      </div>
                      <div className="rounded-xl bg-slate-900/80 p-3 border border-white/5">
                        <span className="text-[10px] text-slate-400 block">Remaining Wheat Balance</span>
                        <strong className="text-xl text-amber-400 font-mono">
                          {String(result.claims?.remainingWheatKg ?? "—")} kg
                        </strong>
                      </div>
                    </div>

                    {/* Atomic Dispense Form */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-3 text-xs">
                      <h4 className="font-semibold text-white">Dispense Grain Quota</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Rice to Dispense (kg)</label>
                          <input
                            type="number"
                            min="0"
                            max={result.claims?.remainingRiceKg || 50}
                            value={riceToDispense}
                            onChange={(e) => setRiceToDispense(Number(e.target.value))}
                            className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Wheat to Dispense (kg)</label>
                          <input
                            type="number"
                            min="0"
                            max={result.claims?.remainingWheatKg || 50}
                            value={wheatToDispense}
                            onChange={(e) => setWheatToDispense(Number(e.target.value))}
                            className="w-full rounded-lg border border-white/10 bg-slate-900 p-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDispense}
                        disabled={dispenseLoading || !result.claims?.documentId}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50"
                      >
                        {dispenseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wheat className="h-4 w-4" />}
                        <span>Confirm Atomic Dispense</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ROLE VIEW 3: Polling Officer Check-in */}
                {role === "polling" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                      <Vote className="h-4 w-4" />
                      <span>Polling Officer Voter Eligibility</span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Voter Wallet ID:</span>
                        <strong className="text-white font-mono">{result.subject}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Election:</span>
                        <input
                          type="text"
                          value={electionId}
                          onChange={(e) => setElectionId(e.target.value)}
                          className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePollCheckin}
                      disabled={pollLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 transition disabled:opacity-50"
                    >
                      {pollLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Vote className="h-4 w-4" />}
                      <span>Mark Voter Checked In</span>
                    </button>
                  </div>
                )}

                {/* ROLE VIEW 4: General / Disclosed Claims */}
                {(role === "general" || role === "bank") && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Disclosed Claims
                    </h4>

                    {result.claims && Object.keys(result.claims).length > 0 ? (
                      <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 space-y-2 text-xs">
                        {Object.entries(result.claims).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                            <span className="font-medium text-white text-right break-all">
                              {typeof v === "object" ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No claims provided in token payload.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Register Verifier Tab */
        <div className="max-w-xl mx-auto rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Verifier Organization Registration</h3>
          </div>
          <p className="text-xs text-slate-400">
            Register your inspection organization to receive a cryptographically hashed API key for automated or terminal verification.
          </p>

          {issuedApiKey ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>API Key Issued Successfully</span>
              </div>
              <p className="text-slate-300">
                Save this key now. For security, it is stored hashed (SHA-256) and cannot be shown again:
              </p>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 p-3 border border-white/10">
                <code className="text-white font-mono break-all text-xs">{issuedApiKey}</code>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(issuedApiKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:text-white"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIssuedApiKey(null);
                  setActiveTab("scan");
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                ← Return to Scanner
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterVerifier} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Organization / Inspector Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. City Traffic Police or Apex National Bank"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Verifier Sector / Type
                </label>
                <select
                  value={regType}
                  onChange={(e) => setRegType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="police">Law Enforcement / Traffic Police</option>
                  <option value="fps">Fair Price Shop (FPS Grain Distribution)</option>
                  <option value="polling">Polling / Election Verification</option>
                  <option value="bank">Banking / Financial Institution</option>
                  <option value="other">Other Commercial Merchant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="officer@agency.org"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading || !regName || !regEmail}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {regLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                <span>Generate Verifier API Key</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
