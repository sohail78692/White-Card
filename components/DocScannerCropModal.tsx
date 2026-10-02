"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { sound } from "@/lib/sound";
import {
  X,
  Check,
  RotateCw,
  RotateCcw,
  Sparkles,
  Maximize2,
  Wand2,
  RefreshCw,
  ScanLine,
} from "lucide-react";

export interface DocScannerResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface CornerPoint {
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
}

interface DocScannerCropModalProps {
  isOpen: boolean;
  rawImageUrl: string;
  title?: string;
  side?: "front" | "back";
  onConfirm: (result: DocScannerResult) => void;
  onCancel: () => void;
}

/**
 * Intelligent Document Edge Detector (CamScanner / Doc Scanner algorithm)
 * Scans image canvas inward to detect where the document card ends and background begins.
 */
function detectDocumentBounds(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { p1: CornerPoint; p2: CornerPoint; p3: CornerPoint; p4: CornerPoint } {
  const w = canvas.width;
  const h = canvas.height;

  // Defaults: 6% inset from image border
  const def = {
    p1: { x: 6, y: 7 },
    p2: { x: 94, y: 7 },
    p3: { x: 94, y: 93 },
    p4: { x: 6, y: 93 },
  };

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Get luminance at (x, y)
    const getL = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    // Sample corner background luminance
    const bgL = (getL(5, 5) + getL(w - 6, 5) + getL(5, h - 6) + getL(w - 6, h - 6)) / 4;

    const threshold = 22; // Contrast threshold for edge detection

    // Scan inward from Left
    let left = Math.round(w * 0.05);
    for (let x = Math.round(w * 0.03); x < w * 0.4; x += 3) {
      let diffSum = 0;
      for (let y = Math.round(h * 0.2); y < h * 0.8; y += 8) {
        diffSum += Math.abs(getL(x, y) - bgL);
      }
      const avgDiff = diffSum / ((h * 0.6) / 8);
      if (avgDiff > threshold) {
        left = x;
        break;
      }
    }

    // Scan inward from Right
    let right = Math.round(w * 0.95);
    for (let x = Math.round(w * 0.97); x > w * 0.6; x -= 3) {
      let diffSum = 0;
      for (let y = Math.round(h * 0.2); y < h * 0.8; y += 8) {
        diffSum += Math.abs(getL(x, y) - bgL);
      }
      const avgDiff = diffSum / ((h * 0.6) / 8);
      if (avgDiff > threshold) {
        right = x;
        break;
      }
    }

    // Scan inward from Top
    let top = Math.round(h * 0.06);
    for (let y = Math.round(h * 0.03); y < h * 0.4; y += 3) {
      let diffSum = 0;
      for (let x = Math.round(w * 0.2); x < w * 0.8; x += 8) {
        diffSum += Math.abs(getL(x, y) - bgL);
      }
      const avgDiff = diffSum / ((w * 0.6) / 8);
      if (avgDiff > threshold) {
        top = y;
        break;
      }
    }

    // Scan inward from Bottom
    let bottom = Math.round(h * 0.94);
    for (let y = Math.round(h * 0.97); y > h * 0.6; y -= 3) {
      let diffSum = 0;
      for (let x = Math.round(w * 0.2); x < w * 0.8; x += 8) {
        diffSum += Math.abs(getL(x, y) - bgL);
      }
      const avgDiff = diffSum / ((w * 0.6) / 8);
      if (avgDiff > threshold) {
        bottom = y;
        break;
      }
    }

    // Clamp sanity
    const minW = w * 0.35;
    const minH = h * 0.35;
    if (right - left < minW || bottom - top < minH) {
      return def;
    }

    return {
      p1: { x: Number(((left / w) * 100).toFixed(1)), y: Number(((top / h) * 100).toFixed(1)) },
      p2: { x: Number(((right / w) * 100).toFixed(1)), y: Number(((top / h) * 100).toFixed(1)) },
      p3: { x: Number(((right / w) * 100).toFixed(1)), y: Number(((bottom / h) * 100).toFixed(1)) },
      p4: { x: Number(((left / w) * 100).toFixed(1)), y: Number(((bottom / h) * 100).toFixed(1)) },
    };
  } catch {
    return def;
  }
}

export function DocScannerCropModal({
  isOpen,
  rawImageUrl,
  title = "Document Scanner",
  side = "front",
  onConfirm,
  onCancel,
}: DocScannerCropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [filterMode, setFilterMode] = useState<"magic" | "original" | "clean">("magic");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  // 4 Draggable Corners in Percentages (0 - 100)
  const [corners, setCorners] = useState<{
    p1: CornerPoint; // Top-Left
    p2: CornerPoint; // Top-Right
    p3: CornerPoint; // Bottom-Right
    p4: CornerPoint; // Bottom-Left
  }>({
    p1: { x: 6, y: 7 },
    p2: { x: 94, y: 7 },
    p3: { x: 94, y: 93 },
    p4: { x: 6, y: 93 },
  });

  // Active dragging state
  const [activeDrag, setActiveDrag] = useState<
    "p1" | "p2" | "p3" | "p4" | "top" | "bottom" | "left" | "right" | null
  >(null);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Load image & trigger automatic Doc Scanner edge detection
  useEffect(() => {
    if (!isOpen || !rawImageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;

      // Run edge detection on temporary small canvas
      const testCanvas = document.createElement("canvas");
      const scale = Math.min(1, 400 / img.naturalWidth);
      testCanvas.width = Math.round(img.naturalWidth * scale);
      testCanvas.height = Math.round(img.naturalHeight * scale);
      const ctx = testCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, testCanvas.width, testCanvas.height);
        const detected = detectDocumentBounds(testCanvas, ctx);
        setCorners(detected);
        setAutoDetected(true);
        sound.playPop();
      }
    };
    img.src = rawImageUrl;
  }, [isOpen, rawImageUrl]);

  const handlePointerDown = (
    handle: "p1" | "p2" | "p3" | "p4" | "top" | "bottom" | "left" | "right",
    e: React.PointerEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag(handle);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setLoupePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const curY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setLoupePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });

    setCorners((prev) => {
      const next = { ...prev };
      if (activeDrag === "p1") next.p1 = { x: Math.min(curX, next.p2.x - 5), y: Math.min(curY, next.p4.y - 5) };
      if (activeDrag === "p2") next.p2 = { x: Math.max(curX, next.p1.x + 5), y: Math.min(curY, next.p3.y - 5) };
      if (activeDrag === "p3") next.p3 = { x: Math.max(curX, next.p4.x + 5), y: Math.max(curY, next.p2.y + 5) };
      if (activeDrag === "p4") next.p4 = { x: Math.min(curX, next.p3.x - 5), y: Math.max(curY, next.p1.y + 5) };

      // Edge midpoint drags
      if (activeDrag === "top") {
        const delta = curY;
        next.p1.y = delta;
        next.p2.y = delta;
      }
      if (activeDrag === "bottom") {
        const delta = curY;
        next.p3.y = delta;
        next.p4.y = delta;
      }
      if (activeDrag === "left") {
        const delta = curX;
        next.p1.x = delta;
        next.p4.x = delta;
      }
      if (activeDrag === "right") {
        const delta = curX;
        next.p2.x = delta;
        next.p3.x = delta;
      }
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActiveDrag(null);
    setLoupePos((prev) => ({ ...prev, visible: false }));
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 1-Tap Reset to Full Frame
  const handleSelectFull = () => {
    sound.playPop();
    setCorners({
      p1: { x: 0, y: 0 },
      p2: { x: 100, y: 0 },
      p3: { x: 100, y: 100 },
      p4: { x: 0, y: 100 },
    });
  };

  // Re-run Auto-Detection
  const handleReAutoDetect = () => {
    if (!imgRef.current) return;
    const testCanvas = document.createElement("canvas");
    const img = imgRef.current;
    const scale = Math.min(1, 400 / img.naturalWidth);
    testCanvas.width = Math.round(img.naturalWidth * scale);
    testCanvas.height = Math.round(img.naturalHeight * scale);
    const ctx = testCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, testCanvas.width, testCanvas.height);
      const detected = detectDocumentBounds(testCanvas, ctx);
      setCorners(detected);
      sound.playSuccess();
    }
  };

  // Execute Final Crop & DocScanner Image Enhancement
  const handleApplyCrop = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);
    sound.playPop();

    try {
      const img = imgRef.current;
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;

      // Calculate pixel crop coordinates from corners
      const minX = Math.round(Math.min(corners.p1.x, corners.p4.x) * (nw / 100));
      const maxX = Math.round(Math.max(corners.p2.x, corners.p3.x) * (nw / 100));
      const minY = Math.round(Math.min(corners.p1.y, corners.p2.y) * (nh / 100));
      const maxY = Math.round(Math.max(corners.p4.y, corners.p3.y) * (nh / 100));

      const cropW = Math.max(50, maxX - minX);
      const cropH = Math.max(50, maxY - minY);

      // Target canvas with standard max 1200 dimension
      const maxDim = 1200;
      let targetW = cropW;
      let targetH = cropH;
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
      if (!ctx) throw new Error("Could not create canvas context");

      // Apply Filter Enhancement (Magic Color / Clean Document)
      if (filterMode === "magic") {
        ctx.filter = "contrast(1.18) brightness(1.04) saturate(1.08)";
      } else if (filterMode === "clean") {
        ctx.filter = "contrast(1.35) grayscale(1) brightness(1.05)";
      } else {
        ctx.filter = "none";
      }

      // Handle Rotation
      if (rotation !== 0) {
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, minX, minY, cropW, cropH, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();
      } else {
        ctx.drawImage(img, minX, minY, cropW, cropH, 0, 0, targetW, targetH);
      }

      // Export compressed JPEG Blob (< 500 KB)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
          "image/jpeg",
          0.85
        );
      });

      const previewUrl = canvas.toDataURL("image/jpeg", 0.85);
      const filename = `${side}_cropped_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: "image/jpeg" });

      sound.playSuccess();
      onConfirm({
        file,
        previewUrl,
        width: targetW,
        height: targetH,
      });
    } catch (err) {
      sound.playError();
      console.error("Crop error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !mounted) return null;

  // Midpoints for edge handles
  const midTop = { x: (corners.p1.x + corners.p2.x) / 2, y: (corners.p1.y + corners.p2.y) / 2 };
  const midRight = { x: (corners.p2.x + corners.p3.x) / 2, y: (corners.p2.y + corners.p3.y) / 2 };
  const midBottom = { x: (corners.p3.x + corners.p4.x) / 2, y: (corners.p3.y + corners.p4.y) / 2 };
  const midLeft = { x: (corners.p4.x + corners.p1.x) / 2, y: (corners.p4.y + corners.p1.y) / 2 };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Doc Scanner Auto-Crop"
      className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 p-0.5 flex items-center justify-center text-white shadow-md">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {title} • {side === "front" ? "Front Side" : "Back Side"}
              </h2>
              {autoDetected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <Sparkles className="h-2.5 w-2.5" /> Auto-Detected
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Auto-cropped to your document borders. Drag corners to adjust.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Interactive Scanner Viewport */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full max-w-2xl flex-1 max-h-[62vh] rounded-2xl overflow-hidden bg-neutral-950 border border-white/20 shadow-2xl flex items-center justify-center touch-none group"
      >
        {/* Base Image */}
        {rawImageUrl && (
          <img
            src={rawImageUrl}
            alt="Captured Document"
            className="w-full h-full object-contain pointer-events-none transition-all duration-150"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter:
                filterMode === "magic"
                  ? "contrast(1.15) brightness(1.04)"
                  : filterMode === "clean"
                    ? "contrast(1.3) grayscale(1)"
                    : "none",
            }}
          />
        )}

        {/* SVG Polygon Overlay & Semi-Transparent Crop Mask */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Outer Dimmed Background Mask */}
          <path
            d={`M0 0 L100 0 L100 100 L0 100 Z M${corners.p1.x} ${corners.p1.y} L${corners.p4.x} ${corners.p4.y} L${corners.p3.x} ${corners.p3.y} L${corners.p2.x} ${corners.p2.y} Z`}
            fill="rgba(0, 0, 0, 0.65)"
            fillRule="evenodd"
          />

          {/* Glowing Green/Cyan Document Edge Lines */}
          <polygon
            points={`${corners.p1.x},${corners.p1.y} ${corners.p2.x},${corners.p2.y} ${corners.p3.x},${corners.p3.y} ${corners.p4.x},${corners.p4.y}`}
            fill="rgba(56, 189, 248, 0.08)"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeDasharray="2 1"
            className="animate-pulse"
          />
        </svg>

        {/* 4 Interactive Corner Handles */}
        {[
          { id: "p1", point: corners.p1, label: "Top-Left" },
          { id: "p2", point: corners.p2, label: "Top-Right" },
          { id: "p3", point: corners.p3, label: "Bottom-Right" },
          { id: "p4", point: corners.p4, label: "Bottom-Left" },
        ].map((c) => (
          <div
            key={c.id}
            onPointerDown={(e) => handlePointerDown(c.id as any, e)}
            style={{ left: `${c.point.x}%`, top: `${c.point.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-move touch-none z-30 group/pin"
            title={`Drag ${c.label} corner`}
          >
            {/* Outer Pulse Ring */}
            <div className="absolute inset-0 rounded-full bg-sky-400/30 animate-ping opacity-75 pointer-events-none" />
            {/* Handle Pin */}
            <div className="h-5 w-5 rounded-full bg-white border-2 border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.8)] transition-transform duration-100 group-hover/pin:scale-125" />
          </div>
        ))}

        {/* 4 Edge Midpoint Handles (to drag full edges) */}
        {[
          { id: "top", point: midTop, label: "Top Edge" },
          { id: "right", point: midRight, label: "Right Edge" },
          { id: "bottom", point: midBottom, label: "Bottom Edge" },
          { id: "left", point: midLeft, label: "Left Edge" },
        ].map((m) => (
          <div
            key={m.id}
            onPointerDown={(e) => handlePointerDown(m.id as any, e)}
            style={{ left: `${m.point.x}%`, top: `${m.point.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-4 rounded-full bg-sky-400/90 hover:bg-sky-300 border border-white/60 shadow-md cursor-pointer flex items-center justify-center z-20 transition active:scale-95"
            title={`Drag ${m.label}`}
          >
            <div className="w-2.5 h-0.5 bg-slate-900 rounded" />
          </div>
        ))}

        {/* Floating Magnifier / Loupe while dragging */}
        {loupePos.visible && (
          <div
            style={{
              left: `${loupePos.x}px`,
              top: `${Math.max(40, loupePos.y - 70)}px`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white shadow-[0_8px_25px_rgba(0,0,0,0.8)] overflow-hidden bg-black z-40"
          >
            <div className="w-full h-full relative flex items-center justify-center">
              {rawImageUrl && (
                <img
                  src={rawImageUrl}
                  alt="Loupe"
                  className="w-[250%] h-[250%] max-w-none object-cover"
                  style={{
                    transform: `translate(-${loupePos.x * 0.4}px, -${loupePos.y * 0.4}px)`,
                  }}
                />
              )}
              {/* Center Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-sky-400" />
                <div className="h-3 w-0.5 bg-sky-400 -ml-1.5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbars & Action Controls */}
      <div className="w-full max-w-2xl space-y-2.5 pt-2">
        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
          {/* Left tools: Re-detect & Full */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReAutoDetect}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1.5 font-semibold text-sky-300 border border-sky-400/30 transition active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Auto-Detect</span>
            </button>
            <button
              type="button"
              onClick={handleSelectFull}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] px-2.5 py-1.5 text-neutral-300 hover:text-white transition active:scale-95"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setRotation((prev) => (prev + 90) % 360);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] px-2.5 py-1.5 text-neutral-300 hover:text-white transition active:scale-95"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Rotate</span>
            </button>
          </div>

          {/* Right tools: Enhance filters (Magic Color vs Original vs Clean) */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setFilterMode("magic");
              }}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                filterMode === "magic"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Wand2 className="h-3 w-3" />
              <span>Magic Color</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setFilterMode("original");
              }}
              className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                filterMode === "original"
                  ? "bg-white/20 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setFilterMode("clean");
              }}
              className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                filterMode === "clean"
                  ? "bg-white/20 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              B&amp;W Clean
            </button>
          </div>
        </div>

        {/* Action Buttons: Cancel vs Accept Auto-Crop vs Confirm */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-6 py-2 text-xs font-bold text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)] active:scale-95 transition disabled:opacity-50"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>{isProcessing ? "Processing..." : "Confirm & Crop"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
