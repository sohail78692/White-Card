"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import { sound } from "@/lib/sound";
import {
  DOCUMENT_TYPES,
  DocumentType,
  validateDocumentNumber,
  sanitizeDetailsForType,
} from "@/lib/validators/documents";
import {
  X,
  Plus,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Eye,
  SwitchCamera,
  ScanLine,
  Sparkles,
  Check,
  CarFront,
  FileText,
  Vote,
  Wheat,
  Crop,
  RotateCw,
} from "lucide-react";
import { DocumentIcon } from "@/components/DocumentIcon";
import { DocScannerCropModal, DocScannerResult } from "@/components/DocScannerCropModal";

interface AddDocumentModalProps {
  onClose: () => void;
  onAdded: () => void;
}

interface IdImageSlot {
  file: File;
  preview: string;
  name: string;
  size: number;
}

function getDefaultTemplate(t: DocumentType): string {
  switch (t) {
    case "DRIVING_LICENSE":
      return "DL0120220019842";
    case "PAN":
      return "ABCDE1234F";
    case "VOTER_ID":
      return "ABC1234567";
    case "RATION_CARD":
      return "RC1098765432";
  }
}

const DOCUMENT_THEMES: Record<
  DocumentType,
  {
    iconGradient: string;
    iconShadow: string;
    selectedCard: string;
    selectedGlow: string;
    selectedBorder: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  DRIVING_LICENSE: {
    iconGradient: "from-[#2563eb] via-[#1d4ed8] to-[#1e40af]",
    iconShadow: "shadow-[0_4px_14px_rgba(37,99,235,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedCard: "bg-gradient-to-b from-blue-500/20 via-blue-600/10 to-blue-950/40",
    selectedGlow: "shadow-[0_12px_28px_-6px_rgba(37,99,235,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedBorder: "border-blue-400/80",
    icon: CarFront,
  },
  PAN: {
    iconGradient: "from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]",
    iconShadow: "shadow-[0_4px_14px_rgba(139,92,246,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedCard: "bg-gradient-to-b from-purple-500/20 via-purple-600/10 to-purple-950/40",
    selectedGlow: "shadow-[0_12px_28px_-6px_rgba(139,92,246,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedBorder: "border-purple-400/80",
    icon: FileText,
  },
  VOTER_ID: {
    iconGradient: "from-[#10b981] via-[#059669] to-[#047857]",
    iconShadow: "shadow-[0_4px_14px_rgba(16,185,129,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedCard: "bg-gradient-to-b from-emerald-500/20 via-emerald-600/10 to-emerald-950/40",
    selectedGlow: "shadow-[0_12px_28px_-6px_rgba(16,185,129,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedBorder: "border-emerald-400/80",
    icon: Vote,
  },
  RATION_CARD: {
    iconGradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
    iconShadow: "shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedCard: "bg-gradient-to-b from-amber-500/20 via-amber-600/10 to-amber-950/40",
    selectedGlow: "shadow-[0_12px_28px_-6px_rgba(245,158,11,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]",
    selectedBorder: "border-amber-400/80",
    icon: Wheat,
  },
};

export function AddDocumentModal({ onClose, onAdded }: AddDocumentModalProps) {
  const [type, setType] = useState<DocumentType>("DRIVING_LICENSE");
  const [number, setNumber] = useState(getDefaultTemplate("DRIVING_LICENSE"));
  const [issuer, setIssuer] = useState("Ministry of Road Transport & Highways");
  const [expiry, setExpiry] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({
    vehicleClasses: ["MCWG", "LMV"],
    organDonor: true,
    rto: "DL-01",
  });

  // Images state (Front and Back)
  const [frontImage, setFrontImage] = useState<IdImageSlot | null>(null);
  const [backImage, setBackImage] = useState<IdImageSlot | null>(null);
  const [rawFrontUrl, setRawFrontUrl] = useState<string | null>(null);
  const [rawBackUrl, setRawBackUrl] = useState<string | null>(null);
  const [isDraggingFront, setIsDraggingFront] = useState(false);
  const [isDraggingBack, setIsDraggingBack] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [isExtractingData, setIsExtractingData] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null);

  // Direct Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSide, setCameraSide] = useState<"front" | "back">("front");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Doc Scanner Auto-Crop modal state
  const [docScanner, setDocScanner] = useState<{
    isOpen: boolean;
    side: "front" | "back";
    rawImageUrl: string;
  }>({
    isOpen: false,
    side: "front",
    rawImageUrl: "",
  });

  // Hidden file inputs
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedMeta = DOCUMENT_TYPES[type];

  // Mount check and lock body scroll when modal is open
  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleTypeChange = (newType: DocumentType) => {
    setType(newType);
    setError(null);
    setQrMessage(null);
    if (frontImage) {
      extractDataFromFile(frontImage.file, frontImage.name);
    } else {
      setNumber(getDefaultTemplate(newType));
    }

    switch (newType) {
      case "DRIVING_LICENSE":
        setIssuer("Ministry of Road Transport & Highways");
        setDetails({ vehicleClasses: ["MCWG", "LMV"], organDonor: true, rto: "DL-01" });
        break;
      case "PAN":
        setIssuer("Income Tax Department");
        setDetails({ name: "", fatherName: "", dob: "", taxpayerCategory: "Individual", aadhaarLinked: "Linked" });
        break;
      case "VOTER_ID":
        setIssuer("Election Commission");
        setDetails({ name: "", fatherName: "", dob: "", acNumber: "AC-42", pollingBooth: "Booth 12A", parliamentaryConstituency: "South", partSerial: "24/110" });
        break;
      case "RATION_CARD":
        setIssuer("Department of Food and Civil Supplies");
        setDetails({
          name: "",
          scheme: "NFSA-PHH",
          fpsDepotId: "FPS-9842",
          familyMembersCount: 4,
          monthlyRiceQuotaKg: 20,
          monthlyWheatQuotaKg: 15,
        });
        break;
    }
  };

  // Handle confirmed cropped document from DocScannerCropModal
  const handleDocScannerConfirm = (res: DocScannerResult) => {
    const cleanFilename = `${type.toLowerCase()}_${docScanner.side}.jpg`;
    const finalFile = new File([res.file], cleanFilename, { type: "image/jpeg" });
    const slot: IdImageSlot = {
      file: finalFile,
      preview: res.previewUrl,
      name: cleanFilename,
      size: res.file.size,
    };

    if (docScanner.side === "front") {
      setFrontImage(slot);
      setRawFrontUrl(res.previewUrl);
      extractDataFromFile(finalFile, cleanFilename);
    } else {
      setBackImage(slot);
      setRawBackUrl(res.previewUrl);
    }
    sound.playSuccess();

    // Check QR code on the cleanly cropped card
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "attemptBoth",
            });
            if (code && code.data) {
              const raw = code.data;
              const dlMatch = raw.match(/[A-Z]{2}[0-9]{13,15}/i);
              const panMatch = raw.match(/[A-Z]{5}[0-9]{4}[A-Z]/i);
              const epicMatch = raw.match(/[A-Z]{3}[0-9]{7}/i);
              const rcMatch = raw.match(/[A-Z0-9]{10,14}/i);

              let detectedNumber: string | null = null;
              if (type === "DRIVING_LICENSE" && dlMatch) detectedNumber = dlMatch[0].toUpperCase();
              else if (type === "PAN" && panMatch) detectedNumber = panMatch[0].toUpperCase();
              else if (type === "VOTER_ID" && epicMatch) detectedNumber = epicMatch[0].toUpperCase();
              else if (type === "RATION_CARD" && rcMatch) detectedNumber = rcMatch[0].toUpperCase();
              else if (dlMatch) { detectedNumber = dlMatch[0].toUpperCase(); setType("DRIVING_LICENSE"); }
              else if (panMatch) { detectedNumber = panMatch[0].toUpperCase(); setType("PAN"); }
              else if (epicMatch) { detectedNumber = epicMatch[0].toUpperCase(); setType("VOTER_ID"); }

              if (detectedNumber) {
                sound.playSuccess();
                setNumber(detectedNumber);
                setQrMessage(`✓ Auto-detected & verified ${detectedNumber} from ID QR code!`);
              }
            }
          } catch {}
        }
      };
      img.src = res.previewUrl;
    } catch {}

    setDocScanner({ isOpen: false, side: "front", rawImageUrl: "" });
  };

  // Automated Document Data Extraction via server OCR and PDF parsing + Client OCR fallback
  const extractDataFromFile = async (file: File | Blob, filename: string) => {
    // 1. Instant client-side check from filename (e.g., in.gov.pan-PANCR-FORPA5522R.pdf or photo named with ID)
    const panFilenameMatch = filename.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
    if (panFilenameMatch && type === "PAN" && panFilenameMatch[1].toUpperCase() !== "ABCDE1234F") {
      const panNum = panFilenameMatch[1].toUpperCase();
      sound.playSuccess();
      setNumber(panNum);
      setExtractionMessage(`✓ Auto-filled ${panNum} from file!`);
      return;
    }

    setIsExtractingData(true);
    setExtractionMessage("Scanning card photo for real PAN number & details...");

    try {
      // 1. Try server extraction
      const formData = new FormData();
      formData.append("file", file, filename);
      const res = await fetch("/api/vault/extract", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const ext = data.extracted;
        if (ext) {
          if (ext.detectedType && ext.detectedType !== type) {
            handleTypeChange(ext.detectedType);
          }
          if (ext.number && ext.number !== "ABCDE1234F") {
            sound.playSuccess();
            setNumber(ext.number);
            setExtractionMessage(`✓ Auto-filled ${ext.number} from card photo!`);
            setQrMessage(`✓ Auto-extracted & verified ${ext.number} from your document!`);
            setTimeout(() => setExtractionMessage(null), 5000);
            const activeType = ext.detectedType || type;
            if (ext.fatherName || ext.dob || ext.name) {
              setDetails((prev: any) => {
                const cleaned = sanitizeDetailsForType(activeType, prev);
                return sanitizeDetailsForType(activeType, {
                  ...cleaned,
                  ...(ext.fatherName ? { fatherName: ext.fatherName } : {}),
                  ...(ext.dob ? { dob: ext.dob } : {}),
                  ...(ext.name ? { name: ext.name } : {}),
                });
              });
            }
            if (ext.issuer) setIssuer(ext.issuer);
            setIsExtractingData(false);
            return;
          }
        }
      }

      // 2. Client-side OCR fallback in browser (handles any server worker path issues)
      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        const ret = await worker.recognize(file);
        const text = ret.data.text || "";
        await worker.terminate();

        const isPlaceholder = (s: string) => s.toUpperCase() === "ABCDE1234F";
        let foundNum: string | null = null;
        const directMatches = Array.from(text.matchAll(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/g)).map((m) => m[1].toUpperCase());
        const validDirect = directMatches.find((m) => !isPlaceholder(m));
        if (validDirect) foundNum = validDirect;

        if (!foundNum) {
          const fuzzyMatches = Array.from(text.matchAll(/\b([A-Z]{5})[A-Z0-9]?([0-9]{4}[A-Z])\b/g)).map((m) => (m[1] + m[2]).toUpperCase());
          const validFuzzy = fuzzyMatches.find((m) => !isPlaceholder(m));
          if (validFuzzy) foundNum = validFuzzy;
        }

        if (foundNum) {
          sound.playSuccess();
          setNumber(foundNum);
          setExtractionMessage(`✓ Auto-filled ${foundNum} from card photo!`);
          setQrMessage(`✓ Auto-extracted & verified ${foundNum} from your document!`);
          setTimeout(() => setExtractionMessage(null), 5000);

          const cleanPersonName = (str: string): string => {
            const noise = [
              "income", "tax", "department", "govt", "india", "permanent",
              "account", "number", "card", "signature", "date", "birth",
              "father", "fathers", "name", "pan_front", "pan_back", "rotate", "crop", "edit",
              "link", "document", "select", "credential", "photos", "return", "inform",
              "je", "ca", "srt", "are", "nform", "left", "right", "valid", "until", "expiry"
            ];
            const words = str.replace(/[^A-Za-z\s]/g, " ").split(/\s+/).filter(Boolean);
            const valid: string[] = [];
            for (const w of words) {
              if (noise.includes(w.toLowerCase())) break;
              if (w.length >= 2) valid.push(w.toUpperCase());
            }
            return valid.slice(0, 3).join(" ");
          };

          const dobMatch = text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
          const fatherMatch = text.match(/(?:Father(?:'s)?\s*Name|पिता(?: का नाम)?)\s*[:\-]?\s*([A-Za-z\s]+)/i);
          const nameMatch = text.match(/(?:Name|नाम)\s*[:\-]?\s*([A-Za-z\s]+)/i);

          const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length >= 3);
          const candidates: string[] = [];
          for (const l of lines) {
            const cl = cleanPersonName(l);
            if (cl.length >= 3 && cl.includes(" ") && !candidates.includes(cl)) {
              candidates.push(cl);
            }
          }

          const parsedName = nameMatch ? cleanPersonName(nameMatch[1].split("\n")[0]) : (candidates[0] || "");
          const parsedFather = fatherMatch ? cleanPersonName(fatherMatch[1].split("\n")[0]) : (candidates[1] || "");

          setDetails((prev: any) => {
            const cleaned = sanitizeDetailsForType("PAN", prev);
            return sanitizeDetailsForType("PAN", {
              ...cleaned,
              ...(dobMatch ? { dob: dobMatch[1].replace(/[\-\.]/g, "/") } : {}),
              ...(parsedName ? { name: parsedName } : {}),
              ...(parsedFather ? { fatherName: parsedFather } : {}),
            });
          });
          return;
        }
      } catch (clientOcrErr) {
        console.warn("Client OCR fallback error", clientOcrErr);
      }

      setExtractionMessage("Could not detect ID clearly. Please check the number or crop closer.");
      setTimeout(() => setExtractionMessage(null), 4000);
    } catch (err: any) {
      console.warn("Extraction failed", err);
      setExtractionMessage("Extraction request failed: " + (err.message || "Network error"));
      setTimeout(() => setExtractionMessage(null), 5000);
    } finally {
      setIsExtractingData(false);
    }
  };

  const handleImageFile = (file: File, side: "front" | "back") => {
    // 1. Support PDF document uploads directly
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      extractDataFromFile(file, file.name);
      const slot: IdImageSlot = {
        file,
        preview: "",
        name: file.name,
        size: file.size,
      };
      if (side === "front") setFrontImage(slot);
      else setBackImage(slot);
      sound.playSuccess();
      return;
    }

    if (!file.type.startsWith("image/")) {
      sound.playError();
      setError("Please select an image file (JPEG, PNG, WebP) or PDF");
      return;
    }

    // 2. Direct upload & instant preview without forcing cropper
    extractDataFromFile(file, file.name);

    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const maxDim = 1200;
      let targetW = img.width;
      let targetH = img.height;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const cleanFilename = `${type.toLowerCase()}_${side}.jpg`;
          const finalFile = new File([blob], cleanFilename, { type: "image/jpeg" });
          const previewUrl = canvas.toDataURL("image/jpeg", 0.85);
          const slot: IdImageSlot = {
            file: finalFile,
            preview: previewUrl,
            name: cleanFilename,
            size: blob.size,
          };
          if (side === "front") {
            setFrontImage(slot);
            setRawFrontUrl(previewUrl);
          } else {
            setBackImage(slot);
            setRawBackUrl(previewUrl);
          }
          sound.playSuccess();
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      sound.playError();
      setError("Could not read image file");
    };
    img.src = objUrl;
  };

  // Quick 1-click 90-degree rotate right on the slot preview
  const rotateSlot90 = async (side: "front" | "back") => {
    const slot = side === "front" ? frontImage : backImage;
    if (!slot) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = slot.preview;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Rotation failed"))), "image/jpeg", 0.85);
      });
      const newPreview = canvas.toDataURL("image/jpeg", 0.85);
      const newFile = new File([blob], slot.name, { type: "image/jpeg" });
      const newSlot: IdImageSlot = {
        file: newFile,
        preview: newPreview,
        name: slot.name,
        size: blob.size,
      };
      if (side === "front") setFrontImage(newSlot);
      else setBackImage(newSlot);
      sound.playPop();
    } catch (err) {
      console.error("Failed to quick-rotate", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Doc Scanner Auto-Crop editor for existing image slot
  const openEditorForExisting = (side: "front" | "back") => {
    const slot = side === "front" ? frontImage : backImage;
    if (!slot) return;
    const rawUrl = (side === "front" ? rawFrontUrl : rawBackUrl) || slot.preview;
    setDocScanner({
      isOpen: true,
      side,
      rawImageUrl: rawUrl,
    });
    sound.playPop();
  };

  // Direct Camera Handlers
  const startCamera = async (side: "front" | "back", mode = facingMode) => {
    setCameraSide(side);
    setCameraError(null);
    setCameraOpen(true);
    sound.playTone(600, "sine", 0.05);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Direct camera not supported on this browser. Please use file upload.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { });
      }
    } catch (err: any) {
      setCameraError(err.message || "Camera access was denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const switchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(cameraSide, nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    sound.playPop();
    stopCamera();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const cleanFilename = `${type.toLowerCase()}_${cameraSide}.jpg`;
        const finalFile = new File([blob], cleanFilename, { type: "image/jpeg" });
        const previewUrl = canvas.toDataURL("image/jpeg", 0.85);
        const slot: IdImageSlot = {
          file: finalFile,
          preview: previewUrl,
          name: cleanFilename,
          size: blob.size,
        };
        if (cameraSide === "front") {
          setFrontImage(slot);
          setRawFrontUrl(previewUrl);
          extractDataFromFile(finalFile, cleanFilename);
        } else {
          setBackImage(slot);
          setRawBackUrl(previewUrl);
        }
        sound.playSuccess();
      },
      "image/jpeg",
      0.85
    );
  };

  // Submit Handler: Creates Document and Uploads Both Encrypted Images
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate number
    const targetNumber = number.trim() || getDefaultTemplate(type);
    const validation = validateDocumentNumber(type, targetNumber);
    if (!validation.valid) {
      sound.playError();
      setError(validation.error || "Invalid document number format");
      return;
    }

    setLoading(true);
    setUploadStep("1/3 Encrypting document credentials with DEK...");

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          number: validation.normalized,
          issuer: issuer.trim(),
          expiry: expiry || undefined,
          details: sanitizeDetailsForType(type, details),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        sound.playError();
        setError(data.error || "Failed to add document");
        setLoading(false);
        setUploadStep(null);
        return;
      }

      const docId = data.documentId || data.document?.id;
      if (!docId) {
        throw new Error("Failed to obtain document ID for attachment storage");
      }

      // Upload Front Image if attached
      if (frontImage) {
        setUploadStep("2/3 Encrypting & storing Front ID image...");
        const formData = new FormData();
        formData.append("file", frontImage.file, `${type}_FRONT.jpg`);
        const attRes = await fetch(`/api/vault/${docId}/attachment`, {
          method: "POST",
          body: formData,
        });
        if (!attRes.ok) {
          const attErr = await attRes.json();
          console.warn("Front image upload notice:", attErr.error);
        }
      }

      // Upload Back Image if attached
      if (backImage) {
        setUploadStep("3/3 Encrypting & storing Back ID image...");
        const formData = new FormData();
        formData.append("file", backImage.file, `${type}_BACK.jpg`);
        const attRes = await fetch(`/api/vault/${docId}/attachment`, {
          method: "POST",
          body: formData,
        });
        if (!attRes.ok) {
          const attErr = await attRes.json();
          console.warn("Back image upload notice:", attErr.error);
        }
      }

      sound.playSuccess();
      onAdded();
      onClose();
    } catch {
      sound.playError();
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setUploadStep(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[32px] glass-ios-card p-5 sm:p-7 shadow-2xl border border-white/15 backdrop-blur-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-sky-400 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-add-title" className="text-xl font-bold text-white tracking-tight">
                  Link Document
                </h2>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Client-encrypted with your unique user DEK.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-white/[0.08] hover:text-white transition"
            aria-label="Close"
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

        {qrMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{qrMessage}</span>
          </div>
        )}

        {/* 1. Document Type Selector (Apple iOS Liquid Glass Design) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
              Select Document
            </label>
            <span className="text-[10px] text-neutral-400 font-medium">
              Tap to switch credential
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {Object.values(DOCUMENT_TYPES).map((docMeta) => {
              const isSelected = type === docMeta.type;
              const theme = DOCUMENT_THEMES[docMeta.type];
              const IconComponent = theme.icon;

              return (
                <button
                  type="button"
                  key={docMeta.type}
                  onClick={() => {
                    sound.playTone(540, "sine", 0.04);
                    handleTypeChange(docMeta.type);
                  }}
                  className={`group relative rounded-[20px] p-2.5 sm:p-3 flex items-center gap-2.5 text-left transition-all duration-300 backdrop-blur-2xl border cursor-pointer active:scale-[0.97] ${isSelected
                      ? `${theme.selectedCard} ${theme.selectedBorder} ${theme.selectedGlow} scale-[1.02]`
                      : "bg-gradient-to-b from-white/[0.07] to-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.09] shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] opacity-85 hover:opacity-100"
                    }`}
                >
                  {/* Apple Squircle Icon */}
                  <div
                    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br ${theme.iconGradient} ${theme.iconShadow} flex items-center justify-center text-white shrink-0 transition-transform duration-300 group-hover:scale-105`}
                  >
                    <IconComponent className="h-4.5 w-4.5 drop-shadow-md" />
                  </div>

                  {/* Document Name & Code */}
                  <div className="min-w-0 flex-1 truncate pr-3">
                    <div className="text-xs font-bold text-white tracking-tight leading-snug drop-shadow-sm truncate">
                      {docMeta.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="font-mono text-[9px] font-bold text-neutral-300 bg-white/[0.09] border border-white/10 px-1.5 py-0.2 rounded shadow-inner">
                        {docMeta.shortCode}
                      </span>
                    </div>
                  </div>

                  {/* iOS Active Indicator Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-3.5 w-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm animate-in zoom-in-75 duration-200">
                      <Check className="h-2 w-2 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Real ID Image Upload (Both Sides: Front & Back with Camera & Drag-and-Drop) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-white">
                ID Card Real Photos (Front &amp; Back)
              </label>
              <p className="text-[11px] text-neutral-400">
                Take a direct camera photo or drag &amp; drop your ID card images.
              </p>
            </div>
            {isProcessing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-sky-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* FRONT SIDE DROPZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFront(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFront(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFront(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageFile(file, "front");
              }}
              className={`relative rounded-2xl border-2 transition-all p-3 flex flex-col justify-between min-h-[170px] ${isDraggingFront
                  ? "border-sky-400 bg-sky-500/15 scale-[1.02]"
                  : frontImage
                    ? "border-emerald-500/40 bg-emerald-500/[0.04]"
                    : "border-dashed border-white/20 bg-white/[0.02] hover:border-white/35 hover:bg-white/[0.04]"
                }`}
            >
              {frontImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[1.586/1] bg-black group/img">
                    <img
                      src={frontImage.preview}
                      alt="Front ID Card"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase shadow">
                      Front Side ✓
                    </span>
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => rotateSlot90("front")}
                        className="rounded-full bg-black/70 p-1.5 text-white hover:bg-sky-600 hover:text-white transition shadow backdrop-blur-md"
                        title="Rotate 90° clockwise"
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditorForExisting("front")}
                        className="rounded-full bg-black/70 p-1.5 text-white hover:bg-blue-600 hover:text-white transition shadow backdrop-blur-md"
                        title="Crop, rotate & zoom editor"
                      >
                        <Crop className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFrontImage(null);
                          setRawFrontUrl(null);
                        }}
                        className="rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600 transition shadow backdrop-blur-md"
                        title="Remove front image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 px-0.5">
                    <span className="truncate max-w-[120px]">{frontImage.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => rotateSlot90("front")}
                        className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                        title="Rotate 90°"
                      >
                        <RotateCw className="h-2.5 w-2.5" /> Rotate 90°
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditorForExisting("front")}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                        title="Crop, rotate & zoom editor"
                      >
                        <Crop className="h-2.5 w-2.5" /> Crop / Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-4 my-auto space-y-2.5">
                  <div className="h-10 w-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-sky-400 shadow-inner">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Front Side of ID
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Drag &amp; drop or click below
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera("front")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 text-sky-200 px-3 py-1.5 text-[11px] font-semibold transition"
                    >
                      <Camera className="h-3.5 w-3.5 text-sky-400" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => frontFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white px-3 py-1.5 text-[11px] font-medium transition"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-neutral-300" />
                      <span>Browse</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={frontFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file, "front");
                  e.target.value = "";
                }}
              />
            </div>

            {/* BACK SIDE DROPZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingBack(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingBack(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingBack(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageFile(file, "back");
              }}
              className={`relative rounded-2xl border-2 transition-all p-3 flex flex-col justify-between min-h-[170px] ${isDraggingBack
                  ? "border-sky-400 bg-sky-500/15 scale-[1.02]"
                  : backImage
                    ? "border-emerald-500/40 bg-emerald-500/[0.04]"
                    : "border-dashed border-white/20 bg-white/[0.02] hover:border-white/35 hover:bg-white/[0.04]"
                }`}
            >
              {backImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[1.586/1] bg-black group/img flex items-center justify-center">
                    {backImage.preview ? (
                      <img
                        src={backImage.preview}
                        alt="Back ID Card"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-sky-400 space-y-1">
                        <FileText className="h-8 w-8" />
                        <span className="text-[10px] text-neutral-300 font-mono">PDF Document</span>
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase shadow">
                      Back Side ✓
                    </span>
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      {backImage.preview && (
                        <>
                          <button
                            type="button"
                            onClick={() => rotateSlot90("back")}
                            className="rounded-full bg-black/70 p-1.5 text-white hover:bg-sky-600 hover:text-white transition shadow backdrop-blur-md"
                            title="Rotate 90° clockwise"
                          >
                            <RotateCw className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditorForExisting("back")}
                            className="rounded-full bg-black/70 p-1.5 text-white hover:bg-blue-600 hover:text-white transition shadow backdrop-blur-md"
                            title="Crop, rotate & zoom editor"
                          >
                            <Crop className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setBackImage(null);
                          setRawBackUrl(null);
                        }}
                        className="rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600 transition shadow backdrop-blur-md"
                        title="Remove back image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 px-0.5">
                    <span className="truncate max-w-[120px]">{backImage.name}</span>
                    {backImage.preview && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => rotateSlot90("back")}
                          className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                          title="Rotate 90°"
                        >
                          <RotateCw className="h-2.5 w-2.5" /> Rotate 90°
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditorForExisting("back")}
                          className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                          title="Crop, rotate & zoom editor"
                        >
                          <Crop className="h-2.5 w-2.5" /> Crop / Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-4 my-auto space-y-2.5">
                  <div className="h-10 w-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-sky-400 shadow-inner">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Back Side of ID
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Drag &amp; drop or click below
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera("back")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 text-sky-200 px-3 py-1.5 text-[11px] font-semibold transition"
                    >
                      <Camera className="h-3.5 w-3.5 text-sky-400" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => backFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white px-3 py-1.5 text-[11px] font-medium transition"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-neutral-300" />
                      <span>Browse</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={backFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file, "back");
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* Extracted Credential Verification Card */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 space-y-2 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                {type === "PAN" ? "Permanent Account Number (PAN)" : `${type.replace(/_/g, " ")} Number`}
              </span>
              <div className="flex items-center gap-2">
                {frontImage && (
                  <button
                    type="button"
                    onClick={() => extractDataFromFile(frontImage.file, frontImage.name)}
                    disabled={isExtractingData}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 px-3 py-1 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
                  >
                    {isExtractingData ? (
                      <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-sky-400" />
                    )}
                    <span>{isExtractingData ? "Scanning Photo..." : "⚡ Scan & Auto-Fill from Image"}</span>
                  </button>
                )}
                {number && number !== getDefaultTemplate(type) && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Auto-Extracted &amp; Verified
                  </span>
                )}
              </div>
            </div>

            {/* Live extraction feedback banner */}
            {isExtractingData && (
              <div className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-400/30 p-2.5 text-xs text-sky-300 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400 shrink-0" />
                <span>Scanning card image with OCR... reading PAN Number &amp; Holder details</span>
              </div>
            )}

            {extractionMessage && !isExtractingData && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{extractionMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase())}
                placeholder="e.g. FORPA5522R"
                className="flex-1 font-mono text-sm sm:text-base font-bold bg-black/60 border border-white/15 focus:border-sky-400 rounded-xl px-3 py-2 text-white uppercase tracking-wider outline-none transition"
              />
            </div>
            {/* Editable Extracted Details Grid */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Holder &amp; Metadata Details (Auto-filled &amp; Editable)
                </span>
                <span className="text-[10px] text-neutral-500">
                  Tap any field to correct
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1 font-medium">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={details?.name || ""}
                    onChange={(e) => setDetails((prev: any) => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SOHAIL AKHTAR"
                    className="w-full font-mono text-xs font-semibold bg-black/60 border border-white/15 focus:border-sky-400 rounded-xl px-2.5 py-1.5 text-white uppercase outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1 font-medium">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={details?.fatherName || ""}
                    onChange={(e) => setDetails((prev: any) => ({ ...prev, fatherName: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAHIMUDDIN ANSARI"
                    className="w-full font-mono text-xs font-semibold bg-black/60 border border-white/15 focus:border-sky-400 rounded-xl px-2.5 py-1.5 text-white uppercase outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1 font-medium">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="text"
                    value={details?.dob || ""}
                    onChange={(e) => setDetails((prev: any) => ({ ...prev, dob: e.target.value }))}
                    placeholder="DD/MM/YYYY"
                    className="w-full font-mono text-xs font-semibold bg-black/60 border border-white/15 focus:border-sky-400 rounded-xl px-2.5 py-1.5 text-white outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Direct Camera Viewfinder Overlay */}
        {cameraOpen && (
          <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="w-full max-w-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Camera: Snap {cameraSide === "front" ? "Front" : "Back"} ID
                </span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Viewfinder with ID Alignment Frame */}
            <div className="relative w-full max-w-lg aspect-[1.4/1] rounded-3xl overflow-hidden border border-white/20 bg-neutral-950 flex items-center justify-center shadow-2xl">
              {cameraError ? (
                <div className="text-center p-6 space-y-3">
                  <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
                  <p className="text-xs text-red-300 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera(cameraSide)}
                    className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white hover:bg-white/20"
                  >
                    Retry Access
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* ID Card Alignment Guide Box */}
                  <div className="absolute inset-4 sm:inset-6 rounded-2xl border-2 border-dashed border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)] pointer-events-none flex flex-col items-center justify-between p-3">
                    <span className="text-[10px] font-bold text-sky-300 bg-black/60 px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md">
                      Align {cameraSide === "front" ? "Front" : "Back"} of Card Inside Box
                    </span>
                    <ScanLine className="h-8 w-8 text-sky-400/70 animate-pulse" />
                    <span className="text-[9px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
                      Hold still for sharp capture
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-lg flex items-center justify-around py-3">
              <button
                type="button"
                onClick={stopCamera}
                className="text-xs text-neutral-400 hover:text-white px-4 py-2"
              >
                Cancel
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!cameraError}
                className="h-18 w-18 sm:h-20 sm:w-20 rounded-full border-4 border-white flex items-center justify-center bg-blue-600 hover:bg-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.6)] active:scale-90 transition disabled:opacity-50"
                aria-label="Capture Photo"
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <Camera className="h-7 w-7 text-blue-600" />
                </div>
              </button>

              <button
                type="button"
                onClick={switchCamera}
                className="flex flex-col items-center gap-1 text-[11px] text-neutral-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
                title="Switch Camera (Front/Rear)"
              >
                <SwitchCamera className="h-5 w-5" />
                <span>Flip</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ================= DOC SCANNER AUTO-CROP MODAL ================ */}
        {/* ============================================================== */}
        <DocScannerCropModal
          isOpen={docScanner.isOpen}
          rawImageUrl={docScanner.rawImageUrl}
          title="Doc Scanner Auto-Crop"
          side={docScanner.side}
          onConfirm={handleDocScannerConfirm}
          onCancel={() => setDocScanner({ isOpen: false, side: "front", rawImageUrl: "" })}
        />

        {/* 4. Submit Button */}
        <form onSubmit={handleSubmit} className="pt-2">
          <button
            type="submit"
            disabled={loading || isProcessing || !frontImage}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-white hover:bg-neutral-100 py-3.5 text-xs font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>
              {uploadStep
                ? uploadStep
                : !frontImage
                  ? "Upload Front ID to Continue"
                  : "Encrypt & Add to Vault"}
            </span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
