"use client";

import React from "react";
import Link from "next/link";
import { sound } from "@/lib/sound";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  History,
  QrCode,
  ArrowRight,
  FileKey2,
  CheckCircle2,
  Car,
  CarFront,
  CreditCard,
  Vote,
  ShoppingBag,
  FileCheck,
  Cpu,
  Layers,
  Fingerprint,
  Wallet,
  Zap,
  Play,
  ChevronRight,
  MoreHorizontal,
  Wheat,
  Users,
  FileText,
  Plus,
  Calendar,
  Landmark,
  User,
  LayoutGrid,
  MapPin,
  Building2,
  Sparkles,
  Trash2,
  Key,
  ShieldAlert,
  Scan,
  KeyRound,
  Mail,
  Check,
  Clock,
  Copy,
  Activity,
  Code,
  Shield,
  Link2,
  HardDrive,
} from "lucide-react";
import QRCode from "qrcode";

interface DocCardFeature {
  label: string;
  icon: React.ReactNode;
}

interface DocumentCardProps {
  title: string;
  description: string;
  badgeText: string;
  icon: React.ReactNode;
  theme: "blue" | "purple" | "emerald" | "amber";
  pills: DocCardFeature[];
  targetHref?: string;
}

const themeStyles = {
  blue: {
    borderHover: "hover:border-blue-400/50",
    glowBg: "bg-blue-600/20 group-hover:bg-blue-500/35",
    frontCardGrad: "from-[#2563eb] via-[#1d4ed8] to-[#172554]",
    frontCardBorder: "border-blue-300/60",
    frontCardShadow: "shadow-[0_10px_25px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.45)]",
    backCardBg: "bg-blue-600/30 border-blue-400/30",
    btnHover: "group-hover:border-blue-400/40 group-hover:bg-blue-500/10",
    pillHover: "hover:border-blue-400/30",
  },
  purple: {
    borderHover: "hover:border-purple-400/50",
    glowBg: "bg-purple-600/20 group-hover:bg-purple-500/35",
    frontCardGrad: "from-[#9333ea] via-[#7c3aed] to-[#3b0764]",
    frontCardBorder: "border-purple-300/60",
    frontCardShadow: "shadow-[0_10px_25px_rgba(147,51,234,0.5),inset_0_1px_0_rgba(255,255,255,0.45)]",
    backCardBg: "bg-purple-600/30 border-purple-400/30",
    btnHover: "group-hover:border-purple-400/40 group-hover:bg-purple-500/10",
    pillHover: "hover:border-purple-400/30",
  },
  emerald: {
    borderHover: "hover:border-emerald-400/50",
    glowBg: "bg-emerald-600/20 group-hover:bg-emerald-500/35",
    frontCardGrad: "from-[#10b981] via-[#059669] to-[#022c22]",
    frontCardBorder: "border-emerald-300/60",
    frontCardShadow: "shadow-[0_10px_25px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.45)]",
    backCardBg: "bg-emerald-600/30 border-emerald-400/30",
    btnHover: "group-hover:border-emerald-400/40 group-hover:bg-emerald-500/10",
    pillHover: "hover:border-emerald-400/30",
  },
  amber: {
    borderHover: "hover:border-amber-400/50",
    glowBg: "bg-amber-600/20 group-hover:bg-amber-500/35",
    frontCardGrad: "from-[#d97706] via-[#b45309] to-[#451a03]",
    frontCardBorder: "border-amber-300/60",
    frontCardShadow: "shadow-[0_10px_25px_rgba(217,119,6,0.5),inset_0_1px_0_rgba(255,255,255,0.45)]",
    backCardBg: "bg-amber-600/30 border-amber-400/30",
    btnHover: "group-hover:border-amber-400/40 group-hover:bg-amber-500/10",
    pillHover: "hover:border-amber-400/30",
  },
};

function DocumentFeatureCard({
  title,
  description,
  badgeText,
  icon,
  theme,
  pills,
  targetHref = "/vault",
}: DocumentCardProps) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0, isHovered: false });
  const styles = themeStyles[theme];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 10;
    setTilt({ x: y, y: x, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, isHovered: false });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#0c1424]/90 via-[#080e1b]/95 to-[#040810]/98 border border-white/[0.08] ${styles.borderHover} p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-[0_14px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden cursor-pointer`}
      style={{
        transform: tilt.isHovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: tilt.isHovered
          ? "transform 0.1s ease-out, border-color 0.3s ease"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Ambient background glow matching card theme */}
      <div className={`absolute top-2 left-2 w-36 h-28 ${styles.glowBg} rounded-full blur-3xl pointer-events-none transition-all duration-500`} />

      {/* Glass specular shimmer sheen on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Top Bar: 3D Stacked Mini-Card & Chevron Button */}
      <div className="flex items-center justify-between relative z-10">
        {/* 3D Stacked Mini Card */}
        <div className="relative w-30 sm:w-32 h-17 sm:h-18 flex items-center justify-start">
          {/* Back card */}
          <div
            className={`absolute inset-0 rounded-[18px] ${styles.backCardBg} border -rotate-[9deg] -translate-x-2 -translate-y-1 blur-[0.4px] transition-transform duration-300 group-hover:-translate-x-2.5 group-hover:-translate-y-1.5 group-hover:-rotate-[11deg]`}
          />
          {/* Front card */}
          <div
            className={`relative w-full h-full rounded-[18px] bg-gradient-to-br ${styles.frontCardGrad} border ${styles.frontCardBorder} p-3 flex items-center justify-between ${styles.frontCardShadow} -rotate-[4deg] transition-all duration-300 group-hover:-rotate-[2deg] group-hover:-translate-y-1 backdrop-blur-xl`}
          >
            <div className="shrink-0 text-white">
              {icon}
            </div>
            <div className="flex-1 pl-3 space-y-1.5 text-right">
              <div className="text-[11px] font-black text-white tracking-widest leading-none">
                {badgeText}
              </div>
              <div className="space-y-1 pt-0.5 flex flex-col items-end">
                <div className="h-1.5 w-full rounded-full bg-white/80" />
                <div className="h-1.5 w-3/4 rounded-full bg-white/50" />
                <div className="h-1.5 w-1/2 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Circular Chevron Arrow Button */}
        <Link
          href={targetHref}
          className={`h-11 w-11 rounded-full bg-white/[0.04] border border-white/10 ${styles.btnHover} flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 shadow-md group/btn`}
        >
          <ChevronRight className="h-4.5 w-4.5 text-white group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5 relative z-10">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* 4 Feature Pills in 2x2 */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-1 relative z-10">
        {pills.map((pill, idx) => (
          <div
            key={idx}
            className={`h-8.5 sm:h-9 rounded-full bg-white/[0.04] border border-white/[0.08] ${styles.pillHover} px-2.5 sm:px-3 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-semibold tracking-tight text-neutral-200 transition-all duration-200 hover:bg-white/[0.08] hover:text-white overflow-hidden`}
          >
            <span className="text-white/70 group-hover:text-white shrink-0 scale-90">
              {pill.icon}
            </span>
            <span className="whitespace-nowrap">{pill.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepToggleGraphic() {
  const [activeToggle, setActiveToggle] = React.useState<number>(0);

  return (
    <div className="w-full flex flex-col justify-center gap-2.5 px-0.5 select-none">
      {/* Row 1 */}
      <div
        onClick={() => {
          sound.playPop();
          setActiveToggle(activeToggle === 0 ? -1 : 0);
        }}
        className="flex items-center justify-between gap-2.5 cursor-pointer group/row"
        title="Toggle claim sharing"
      >
        <div className="h-1.5 w-9 sm:w-10 rounded-full bg-white/20 group-hover/row:bg-white/35 transition-colors" />
        <div
          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all duration-200 ${
            activeToggle === 0
              ? "bg-[#2f86ff] justify-end shadow-[0_0_12px_rgba(47,134,255,0.7)]"
              : "bg-[#222531] border border-white/10 justify-start"
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full shadow-sm transition-colors ${
              activeToggle === 0 ? "bg-white" : "bg-[#6b7280]"
            }`}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div
        onClick={() => {
          sound.playPop();
          setActiveToggle(activeToggle === 1 ? -1 : 1);
        }}
        className="flex items-center justify-between gap-2.5 cursor-pointer group/row"
        title="Toggle claim sharing"
      >
        <div className="h-1.5 w-11 sm:w-12 rounded-full bg-white/20 group-hover/row:bg-white/35 transition-colors" />
        <div
          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all duration-200 ${
            activeToggle === 1
              ? "bg-[#2f86ff] justify-end shadow-[0_0_12px_rgba(47,134,255,0.7)]"
              : "bg-[#222531] border border-white/10 justify-start"
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full shadow-sm transition-colors ${
              activeToggle === 1 ? "bg-white" : "bg-[#6b7280]"
            }`}
          />
        </div>
      </div>

      {/* Row 3 */}
      <div
        onClick={() => {
          sound.playPop();
          setActiveToggle(activeToggle === 2 ? -1 : 2);
        }}
        className="flex items-center justify-between gap-2.5 cursor-pointer group/row"
        title="Toggle claim sharing"
      >
        <div className="h-1.5 w-8 sm:w-9 rounded-full bg-white/20 group-hover/row:bg-white/35 transition-colors" />
        <div
          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all duration-200 ${
            activeToggle === 2
              ? "bg-[#2f86ff] justify-end shadow-[0_0_12px_rgba(47,134,255,0.7)]"
              : "bg-[#222531] border border-white/10 justify-start"
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full shadow-sm transition-colors ${
              activeToggle === 2 ? "bg-white" : "bg-[#6b7280]"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

function HowItWorksStepCard({
  stepNumber,
  title,
  description,
  graphic,
}: {
  stepNumber: string;
  title: React.ReactNode;
  description: string;
  graphic: React.ReactNode;
}) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 8;
    setTilt({ x: y, y: x, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, isHovered: false });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: tilt.isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)",
        transition: tilt.isHovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="group relative flex-1 min-w-0 rounded-[26px] sm:rounded-[28px] bg-gradient-to-b from-[#11131c]/90 via-[#0c0e15]/85 to-[#08090e]/95 border border-white/[0.08] hover:border-white/[0.2] p-5 sm:p-6 lg:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-300 flex items-center justify-between gap-4 backdrop-blur-2xl"
    >
      {/* Content Column */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-7 w-7 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
          {stepNumber}
        </div>
        <h3 className="text-base sm:text-lg lg:text-[19px] font-bold text-white tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-[11px] sm:text-xs lg:text-[12.5px] text-neutral-400 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Graphic Container (Squircle) */}
      <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-[116px] lg:h-[116px] rounded-[22px] bg-[#11131a] border border-white/[0.08] group-hover:border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(0,0,0,0.6)] flex items-center justify-center p-3 relative backdrop-blur-md transition-all duration-300 group-hover:scale-105">
        {graphic}
      </div>
    </div>
  );
}

function SelectiveDisclosureFeatureCard() {
  const [items, setItems] = React.useState([
    { id: "age", label: "Age 18+", sub: "Only your age group is shared", type: "user", status: "verified" as "verified" | "hidden" },
    { id: "dl", label: "Driving License", sub: "License status is shared", type: "car", status: "verified" as "verified" | "hidden" },
    { id: "addr", label: "Full Address", sub: "Your complete address is hidden", type: "address", status: "hidden" as "verified" | "hidden" },
  ]);

  const toggleItem = (id: string) => {
    sound.playPop();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "verified" ? "hidden" : "verified",
              sub:
                item.status === "verified"
                  ? item.id === "addr"
                    ? "Your complete address is hidden"
                    : `${item.label} is hidden`
                  : item.id === "addr"
                  ? "Address claim verified"
                  : item.id === "age"
                  ? "Only your age group is shared"
                  : "License status is shared",
            }
          : item
      )
    );
  };

  return (
    <div className="relative group rounded-[20px] bg-[#070b14] border border-white/[0.12] hover:border-blue-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_20px_50px_rgba(0,100,255,0.15)] p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[310px]">
      {/* Subtle ambient glass tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] via-transparent to-blue-500/[0.02] pointer-events-none rounded-[20px]" />

      {/* Background Illustration filling the box properly with smooth left fade mask */}
      <img
        src="/privacy/share-only.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_55%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left, fading smoothly right for text readability */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070b14]/95 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header: Icon + Titles on left, Pill on right */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/[0.15] border border-blue-500/35 text-[#2997FF] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(41,151,255,0.4)] transition-shadow duration-300">
            <EyeOff className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-[17px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              Share Only What You Need
            </h3>
            <p className="text-[11px] sm:text-[11.5px] text-[#CBD5E1] mt-0.5 leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              Prove eligibility without revealing your full identity details.
            </p>
          </div>
        </div>
        <span className="text-[9.5px] font-bold tracking-wider rounded-full bg-blue-500/[0.18] border border-blue-500/40 text-[#38bdf8] px-2.5 py-1 shrink-0 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md">
          SELECTIVE SHARING
        </span>
      </div>

      {/* Information to Share Panel (Transparent Glass Tray with Visible Text) */}
      <div className="relative z-10 rounded-[16px] bg-white/[0.04] border border-white/[0.12] p-3 flex-1 flex flex-col justify-between mt-3 max-w-[340px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[11px] text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Information to Share</span>
          <span className="text-[11px] text-[#00E599] font-medium flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E599]"></span>
            </span>
            <span>You&apos;re in control</span>
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="flex items-center justify-between p-2 rounded-[11px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 cursor-pointer select-none active:scale-[0.99] backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5">
                {item.type === "user" && (
                  <div className="w-7 h-7 rounded-[8px] bg-[#0c234b]/90 border border-[#1e4d94] text-[#2997FF] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(41,151,255,0.3)]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                {item.type === "car" && (
                  <div className="w-7 h-7 rounded-[8px] bg-[#221340]/90 border border-[#5b21b6] text-[#c084fc] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(192,132,252,0.3)]">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                )}
                {item.type === "address" && (
                  <div className="w-7 h-7 rounded-[8px] bg-[#331c08]/90 border border-[#b45309] text-[#f59e0b] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="text-left">
                  <div className="text-[12px] font-bold text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">{item.label}</div>
                  <div className="text-[10px] text-[#CBD5E1] mt-0.5 leading-none font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{item.sub}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {item.status === "verified" ? (
                  <span className="rounded-full bg-blue-500/[0.22] border border-blue-500/50 text-[#38bdf8] px-2 py-0.5 text-[9.5px] font-bold flex items-center gap-1 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
                    <CheckCircle2 className="w-2.5 h-2.5 fill-[#38bdf8] text-[#080d19]" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-white/[0.08] border border-white/20 text-[#E2E8F0] px-2 py-0.5 text-[9.5px] font-semibold flex items-center gap-1 shrink-0 backdrop-blur-md">
                    <EyeOff className="w-2.5 h-2.5 stroke-[2]" />
                    <span>Hidden</span>
                  </span>
                )}
                <ChevronRight className="w-3 h-3 text-[#CBD5E1]/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SelfDestructQRFeatureCard() {
  const [timeLeft, setTimeLeft] = React.useState(120); // 02:00
  const [qrUrl, setQrUrl] = React.useState<string>("");

  const generateQr = React.useCallback(async () => {
    try {
      const livePayload = `https://whitecard.internal/v/proof-${Date.now().toString(36)}`;
      const url = await QRCode.toDataURL(livePayload, {
        width: 320,
        margin: 0,
        color: {
          dark: "#060b17",
          light: "#FFFFFF",
        },
      });
      setQrUrl(url);
    } catch {
      // Fallback
    }
  }, []);

  React.useEffect(() => {
    generateQr();
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, [generateQr]);

  const handleGenerateNewQr = () => {
    sound.playPop();
    setTimeLeft(120); // reset to 02:00
    generateQr();
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="relative group rounded-[20px] bg-[#070b14] border border-white/[0.12] hover:border-blue-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_20px_50px_rgba(0,100,255,0.15)] p-5 sm:p-6 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[310px]">
      {/* Subtle ambient glass tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] via-transparent to-blue-500/[0.02] pointer-events-none rounded-[20px]" />

      {/* Background Illustration filling the box properly with smooth left fade mask */}
      <img
        src="/privacy/temporary-qr.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_55%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left, fading smoothly right for text readability */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070b14]/95 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header: Icon + Titles on left, Pill on right */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/[0.15] border border-blue-500/35 text-[#2997FF] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(41,151,255,0.4)] transition-shadow duration-300">
            <Zap className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-[17px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              Temporary QR Sharing
            </h3>
            <p className="text-[11px] sm:text-[11.5px] text-[#CBD5E1] mt-0.5 leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              Create a QR code that expires automatically after a short time.
            </p>
          </div>
        </div>
        <span className="text-[9.5px] font-bold tracking-wider rounded-full bg-blue-500/[0.18] border border-blue-500/40 text-[#38bdf8] px-2.5 py-1 shrink-0 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md">
          AUTO-EXPIRING ACCESS
        </span>
      </div>

      {/* QR & Verification Panel */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mt-3 max-w-[340px]">
        {/* Left: QR Code with Precision Cyan Bracket Glow */}
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Snug Viewfinder Reticle Brackets */}
          <div className="absolute -inset-1.5 pointer-events-none drop-shadow-[0_0_8px_rgba(41,151,255,0.85)]">
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#2997FF] rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#2997FF] rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#2997FF] rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#2997FF] rounded-br-sm" />
          </div>

          <div className="w-[94px] h-[94px] sm:w-[98px] sm:h-[98px] rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.7)]">
            {qrUrl ? (
              <img src={qrUrl} alt="Temporary Sharing QR Code" className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-full h-full text-[#070b14]" />
            )}
          </div>
        </div>

        {/* Right Side: Active, Countdown, Description, Button */}
        <div className="flex-1 w-full space-y-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E599]"></span>
            </span>
            <span className="text-[11.5px] font-bold text-[#00E599]">Active</span>
          </div>

          <div>
            <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Expires in</div>
            <div className="text-[24px] font-extrabold text-white tracking-wider font-mono my-0.5 tabular-nums leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {String(mins).padStart(2, "0")} : {String(secs).padStart(2, "0")}
            </div>
            <p className="text-[11px] text-[#CBD5E1] leading-tight font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              This QR code will expire automatically.
            </p>
          </div>

          <div className="pt-1">
            <button
              onClick={handleGenerateNewQr}
              className="w-full flex items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#2997FF] to-[#0071e3] hover:from-[#38bdf8] hover:to-[#2997FF] text-white text-[10.5px] font-semibold py-1.5 px-3 shadow-[0_4px_16px_rgba(41,151,255,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <Clock className="w-3 h-3 text-white" />
              <span>Generate New QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordlessAuthFeatureCard() {
  const [authState, setAuthState] = React.useState<"idle" | "sending" | "verified">("idle");

  const handleSimulateAuth = () => {
    sound.playPop();
    setAuthState("sending");
    setTimeout(() => {
      sound.playSuccess();
      setAuthState("verified");
      setTimeout(() => setAuthState("idle"), 2400);
    }, 700);
  };

  return (
    <div className="relative group rounded-[18px] bg-[#070b14] border border-white/[0.12] hover:border-blue-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_20px_50px_rgba(0,100,255,0.15)] p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[240px] sm:min-h-[260px]">
      {/* Subtle ambient glass tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] via-transparent to-blue-500/[0.02] pointer-events-none rounded-[18px]" />

      {/* Background Illustration filling the box properly with smooth left fade mask */}
      <img
        src="/privacy/passwordless-otp.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_55%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left, fading smoothly right for text readability */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070b14]/95 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-500/[0.15] border border-blue-500/35 text-[#2997FF] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(41,151,255,0.4)] transition-shadow duration-300">
          <Key className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-1.5 text-left max-w-[195px] sm:max-w-[215px]">
        <h3 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Passwordless Email OTP
        </h3>
        <p className="text-[11px] sm:text-[11.5px] text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          No passwords to forget, steal, or leak. Your wallet authenticates with hardware-random one-time verification tokens.
        </p>
      </div>

      {/* Bottom Tray */}
      <div className="relative z-10 rounded-[12px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-white/[0.2] p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-[8px] bg-[#0c234b]/80 border border-[#1e4d94] text-[#2997FF] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(41,151,255,0.25)]">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 pr-1">
            <div className="text-[11px] font-bold text-white truncate leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Secure 6-Digit OTP</div>
            <div className="text-[9.5px] text-[#CBD5E1] truncate mt-0.5 font-medium">Cryptographic Verification</div>
          </div>
        </div>

        <button
          onClick={handleSimulateAuth}
          disabled={authState !== "idle"}
          className="rounded-[10px] bg-gradient-to-r from-[#2997FF] to-[#0071e3] hover:from-[#38bdf8] hover:to-[#2997FF] text-white text-[10px] font-semibold px-2.5 sm:px-3 py-1.5 shadow-[0_4px_14px_rgba(41,151,255,0.4)] transition-all duration-200 active:scale-95 shrink-0 cursor-pointer disabled:opacity-75 whitespace-nowrap"
        >
          {authState === "idle" ? "Simulate OTP →" : authState === "sending" ? "Sending..." : "Verified ✓"}
        </button>
      </div>
    </div>
  );
}

function InstantRevokeFeatureCard() {
  const [isRevoked, setIsRevoked] = React.useState(false);

  return (
    <div className="relative group rounded-[18px] bg-[#070b14] border border-white/[0.12] hover:border-red-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_20px_50px_rgba(225,29,72,0.15)] p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[240px] sm:min-h-[260px]">
      {/* Subtle ambient glass red tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] via-transparent to-red-500/[0.02] pointer-events-none rounded-[18px]" />

      {/* Background Illustration filling the box properly with smooth left fade mask */}
      <img
        src="/privacy/instant-revocation.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_55%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left, fading smoothly right for text readability */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070b14]/95 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-red-500/[0.15] border border-red-500/35 text-[#FF3B5C] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(255,59,92,0.4)] transition-shadow duration-300">
          <Lock className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-1.5 text-left max-w-[195px] sm:max-w-[215px]">
        <h3 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Instant 1-Tap Access Revocation
        </h3>
        <p className="text-[11px] sm:text-[11.5px] text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Changed your mind after showing an ID? Kill the token remotely in real time. Verifiers immediately see an invalidated claim notice.
        </p>
      </div>

      {/* Bottom Tray */}
      <div className="relative z-10 rounded-[12px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-white/[0.2] p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300">
        <div>
          <div className="text-[9.5px] text-[#94A3B8] font-semibold leading-none uppercase tracking-wide">Token Status</div>
          <div className={`text-[11px] font-bold mt-1 flex items-center gap-1.5 ${isRevoked ? "text-[#FF3B5C]" : "text-[#00E599]"}`}>
            {!isRevoked && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E599]"></span>
              </span>
            )}
            {isRevoked ? "Terminated ✕" : "Active & Authorised"}
          </div>
        </div>

        <button
          onClick={() => {
            sound.playPop();
            setIsRevoked(!isRevoked);
          }}
          className={`text-white text-[10px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-[10px] flex items-center gap-1.5 transition-all duration-200 active:scale-95 shrink-0 cursor-pointer whitespace-nowrap ${
            isRevoked
              ? "bg-white/[0.1] hover:bg-white/[0.16] text-white border border-white/20"
              : "bg-gradient-to-r from-[#e11d48] to-[#be123c] hover:from-[#f43f5e] hover:to-[#e11d48] shadow-[0_4px_16px_rgba(225,29,72,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
          }`}
        >
          <Trash2 className="w-3 h-3" />
          <span>{isRevoked ? "Restore" : "Revoke Access"}</span>
        </button>
      </div>
    </div>
  );
}

function LiveAuditLogFeatureCard() {
  const [logs] = React.useState([
    { id: 1, action: "Driving License age proof shared", time: "Just now", dot: "bg-[#00E599]" },
    { id: 2, action: "PAN Card masked copy generated", time: "18m ago", dot: "bg-[#2997FF]" },
    { id: 3, action: "Voter ID token expired and cleared", time: "1h ago", dot: "bg-[#38bdf8]" },
  ]);

  return (
    <div className="relative group rounded-[18px] bg-[#070b14] border border-white/[0.12] hover:border-emerald-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_20px_50px_rgba(0,229,153,0.15)] p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[240px] sm:min-h-[260px]">
      {/* Subtle ambient glass emerald tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-emerald-500/[0.02] pointer-events-none rounded-[18px]" />

      {/* Background Illustration filling the box properly with smooth left fade mask */}
      <img
        src="/privacy/verification-log.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_55%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left, fading smoothly right for text readability */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070b14]/95 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/[0.15] border border-emerald-500/35 text-[#00E599] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(0,229,153,0.4)] transition-shadow duration-300">
          <FileText className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-1.5 text-left max-w-[195px] sm:max-w-[215px]">
        <h3 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Real-Time Verification Log
        </h3>
        <p className="text-[11px] sm:text-[11.5px] text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Every scan, share, or download writes to your local private ledger. You always know who inspected your credentials and when.
        </p>
      </div>

      {/* Bottom Tray */}
      <div className="relative z-10 rounded-[12px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-white/[0.2] p-2.5 space-y-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300">
        {logs.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-xs py-0.5 text-neutral-400 hover:text-white transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shrink-0 shadow-[0_0_6px_currentColor]`} />
              <span className="truncate text-white text-[11px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{item.action}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-[#CBD5E1] font-medium">{item.time}</span>
              <ChevronRight className="w-3 h-3 text-[#64748B]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityEnclaveMasterCard() {
  return (
    <div className="relative group rounded-[20px] sm:rounded-[22px] bg-[#070b14] border border-white/[0.12] hover:border-blue-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_20px_50px_rgba(0,100,255,0.18)] p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[235px] sm:min-h-[255px]">
      {/* Subtle ambient glass tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-blue-500/[0.02] pointer-events-none rounded-[22px]" />

      {/* Background Illustration filling right side with smooth left fade mask */}
      <img
        src="/security/silicon-sealed.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_60%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left for pristine text readability */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[62%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#070b14]/90 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
        <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-[7px] sm:rounded-[8px] bg-blue-500/[0.15] border border-blue-400/35 text-[#2997FF] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(41,151,255,0.4)] transition-shadow duration-300">
          <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
        </div>
        <span className="text-[9.5px] sm:text-[10px] font-bold tracking-[0.14em] text-[#2997FF] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          HARDWARE SECURITY
        </span>
      </div>

      {/* Main Content - Fixed Top Margin for Consistent Horizontal Alignment */}
      <div className="relative z-10 mt-3 sm:mt-3.5 space-y-1 max-w-[210px] sm:max-w-[230px] text-left">
        <h3 className="text-xl sm:text-[22px] font-bold text-white tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          Encrypted Keys
        </h3>
        <p className="text-[11.5px] sm:text-xs text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Your keys are securely stored inside your phone&apos;s protected chip.
        </p>
      </div>

      {/* Bottom Chips - mt-auto so both top cards align on bottom */}
      <div className="relative z-10 mt-auto pt-3 flex flex-wrap items-center gap-2">
        {/* Chip 1: Encryption AES-256 */}
        <div className="rounded-[11px] sm:rounded-[12px] bg-[#0c1424]/90 hover:bg-[#0f1930]/95 border border-white/[0.12] hover:border-white/[0.22] px-2.5 sm:px-3 py-1.5 flex items-center gap-2 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300">
          <div className="w-5.5 sm:w-6 h-5.5 sm:h-6 rounded-[6px] sm:rounded-[7px] bg-blue-500/[0.15] border border-blue-400/30 text-[#2997FF] flex items-center justify-center shrink-0">
            <Shield className="w-3 h-3 stroke-[2.2]" />
          </div>
          <div className="text-left">
            <div className="text-[7.5px] sm:text-[8px] text-[#94A3B8] font-medium leading-none">Encryption</div>
            <div className="text-[10px] sm:text-[10.5px] font-bold text-white font-mono mt-0.5 leading-tight">AES-256</div>
          </div>
        </div>

        {/* Chip 2: Key Status On Device */}
        <div className="rounded-[11px] sm:rounded-[12px] bg-[#0c1424]/90 hover:bg-[#0f1930]/95 border border-white/[0.12] hover:border-white/[0.22] px-2.5 sm:px-3 py-1.5 flex items-center gap-2 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300">
          <div className="w-5.5 sm:w-6 h-5.5 sm:h-6 rounded-[6px] sm:rounded-[7px] bg-blue-500/[0.15] border border-blue-400/30 text-[#2997FF] flex items-center justify-center shrink-0">
            <Cpu className="w-3 h-3 stroke-[2.2]" />
          </div>
          <div className="text-left">
            <div className="text-[7.5px] sm:text-[8px] text-[#94A3B8] font-medium leading-none">Key Status</div>
            <div className="text-[10px] sm:text-[10.5px] font-bold text-[#00E599] mt-0.5 flex items-center gap-1.5 leading-tight whitespace-nowrap">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E599]"></span>
              </span>
              <span>On Device</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityProofSealCard() {
  const [copied, setCopied] = React.useState(false);
  const proofHash = "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc24db1fa3d677284addd200126d9069";

  const handleCopyProof = () => {
    sound.playPop();
    navigator.clipboard?.writeText(proofHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-[20px] sm:rounded-[22px] bg-[#070b14] border border-white/[0.12] hover:border-indigo-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.18)] p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[235px] sm:min-h-[255px]">
      {/* Subtle ambient glass tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-indigo-500/[0.02] pointer-events-none rounded-[22px]" />

      {/* Background Illustration filling right side with smooth left fade mask */}
      <img
        src="/security/sha256-chain.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_60%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[62%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#070b14]/90 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
        <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-[7px] sm:rounded-[8px] bg-indigo-500/[0.15] border border-indigo-400/35 text-[#818cf8] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(129,140,248,0.4)] transition-shadow duration-300">
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
        </div>
        <span className="text-[9.5px] sm:text-[10px] font-bold tracking-[0.14em] text-[#818cf8] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          DATA INTEGRITY
        </span>
      </div>

      {/* Main Content - Fixed Top Margin matching Card 1, cleanly 2 lines */}
      <div className="relative z-10 mt-3 sm:mt-3.5 space-y-1 max-w-[210px] sm:max-w-[230px] text-left">
        <h3 className="text-xl sm:text-[22px] font-bold text-white tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          Tamper-Proof<br />SHA-256 Chain
        </h3>
        <p className="text-[11.5px] sm:text-xs text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Every document check is recorded in a secure hash chain.
        </p>
      </div>

      {/* Bottom Chips - mt-auto matching Card 1 */}
      <div className="relative z-10 mt-auto pt-3 flex flex-wrap items-center gap-2">
        {/* Chip 1: Hash Algorithm SHA-256 */}
        <div className="rounded-[11px] sm:rounded-[12px] bg-[#0c1424]/90 hover:bg-[#0f1930]/95 border border-white/[0.12] hover:border-white/[0.22] px-2.5 sm:px-3 py-1.5 flex items-center gap-2 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300">
          <div className="w-5.5 sm:w-6 h-5.5 sm:h-6 rounded-[6px] sm:rounded-[7px] bg-indigo-500/[0.15] border border-indigo-400/30 text-[#818cf8] flex items-center justify-center shrink-0">
            <Link2 className="w-3 h-3 stroke-[2.2]" />
          </div>
          <div className="text-left">
            <div className="text-[7.5px] sm:text-[8px] text-[#94A3B8] font-medium leading-none">Hash Algorithm</div>
            <div className="text-[10px] sm:text-[10.5px] font-bold text-white font-mono mt-0.5 leading-tight">SHA-256</div>
          </div>
        </div>

        {/* Chip 2: Chain Intact Pill (Interactive) */}
        <button
          onClick={handleCopyProof}
          title="Click to copy SHA-256 genesis proof"
          className="rounded-full bg-emerald-500/[0.16] hover:bg-emerald-500/[0.24] border border-emerald-500/40 text-[#00E599] px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[10.5px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_14px_rgba(0,229,153,0.15)] active:scale-95 transition-all cursor-pointer"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E599]"></span>
          </span>
          <span className="font-semibold">{copied ? "Hash Copied! ✓" : "Chain Intact"}</span>
        </button>
      </div>
    </div>
  );
}

function SecurityShredderCard() {
  const [isWiped, setIsWiped] = React.useState(false);

  const handleWipe = () => {
    sound.playPop();
    setIsWiped(true);
    setTimeout(() => {
      sound.playSuccess();
    }, 400);
    setTimeout(() => setIsWiped(false), 3000);
  };

  return (
    <div className="relative group rounded-[18px] sm:rounded-[20px] bg-[#070b14] border border-white/[0.12] hover:border-red-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_20px_50px_rgba(225,29,72,0.18)] p-3.5 sm:p-4 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[205px] sm:min-h-[220px]">
      {/* Subtle ambient glass red tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.06] via-transparent to-red-500/[0.02] pointer-events-none rounded-[20px]" />

      {/* Background Illustration */}
      <img
        src="/security/shredder.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_60%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#070b14]/90 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center gap-1.5">
        <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-[6px] sm:rounded-[7px] bg-red-500/[0.15] border border-red-500/35 text-[#EF4444] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] transition-shadow duration-300">
          <Trash2 className="w-3 h-3 stroke-[2]" />
        </div>
        <span className="text-[9px] sm:text-[9.5px] font-bold tracking-[0.14em] text-[#EF4444] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          INSTANT PROTECTION
        </span>
      </div>

      {/* Main Content - Consistent Top Margin */}
      <div className="relative z-10 mt-2.5 sm:mt-3 space-y-1 max-w-[155px] sm:max-w-[170px] text-left">
        <h3 className="text-[16px] sm:text-[17.5px] font-bold text-white tracking-tight leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          1-Tap Shredder
        </h3>
        <p className="text-[10.5px] sm:text-[11.5px] text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Permanently delete local documents and keys.
        </p>
      </div>

      {/* Bottom Chips / Action Button - mt-auto */}
      <div className="relative z-10 mt-auto pt-2.5 flex items-center gap-1.5 sm:gap-2">
        {/* Chip 1: Delete Mode Secure Wipe */}
        <div className="rounded-[11px] bg-[#0c1424]/90 hover:bg-[#0f1930]/95 border border-white/[0.12] hover:border-white/[0.22] px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 backdrop-blur-xl min-w-0 flex-1 shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300">
          <div className="w-5 h-5 rounded-[5px] bg-[#1a1324] border border-red-500/25 text-[#fca5a5] flex items-center justify-center shrink-0">
            <HardDrive className="w-2.5 h-2.5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[7px] sm:text-[7.5px] text-[#94A3B8] font-medium leading-none">Delete Mode</div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-white mt-0.5 truncate leading-tight">Secure Wipe</div>
          </div>
        </div>

        {/* Chip 2: Delete Now Button */}
        <button
          onClick={handleWipe}
          disabled={isWiped}
          className="rounded-[11px] bg-gradient-to-r from-[#e11d48] to-[#be123c] hover:from-[#f43f5e] hover:to-[#e11d48] text-white text-[10px] sm:text-[10.5px] font-bold px-2 sm:px-2.5 py-1.5 flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-95 transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_16px_rgba(225,29,72,0.4)] hover:shadow-[0_0_24px_rgba(225,29,72,0.65)] hover:scale-[1.02] border border-white/20 backdrop-blur-md"
        >
          <Trash2 className="w-3 h-3" />
          <span>{isWiped ? "Destroyed ✓" : "Delete Now →"}</span>
        </button>
      </div>
    </div>
  );
}

function SecurityAntiReplayCard() {
  return (
    <div className="relative group rounded-[18px] sm:rounded-[20px] bg-[#070b14] border border-white/[0.12] hover:border-emerald-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_20px_50px_rgba(0,229,153,0.18)] p-3.5 sm:p-4 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[205px] sm:min-h-[220px]">
      {/* Subtle ambient glass emerald tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-emerald-500/[0.02] pointer-events-none rounded-[20px]" />

      {/* Background Illustration */}
      <img
        src="/security/anti-screenshot.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_60%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#070b14]/90 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center gap-1.5">
        <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-[6px] sm:rounded-[7px] bg-emerald-500/[0.15] border border-emerald-500/35 text-[#00E599] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(0,229,153,0.4)] transition-shadow duration-300">
          <ShieldCheck className="w-3 h-3 stroke-[2]" />
        </div>
        <span className="text-[9px] sm:text-[9.5px] font-bold tracking-[0.14em] text-[#00E599] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          SCREENSHOT DEFENSE
        </span>
      </div>

      {/* Main Content - Consistent Top Margin matching Card 3 & Card 5 */}
      <div className="relative z-10 mt-2.5 sm:mt-3 space-y-1 max-w-[155px] sm:max-w-[170px] text-left">
        <h3 className="text-[16px] sm:text-[17.5px] font-bold text-white tracking-tight leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Anti-Screenshot
        </h3>
        <p className="text-[10.5px] sm:text-[11.5px] text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Blocks screenshots and recordings automatically.
        </p>
      </div>

      {/* Bottom Chip: Protection Always On - mt-auto */}
      <div className="relative z-10 mt-auto pt-2.5">
        <div className="rounded-[11px] bg-[#0c1424]/90 hover:bg-[#0f1930]/95 border border-white/[0.12] hover:border-white/[0.22] px-2.5 sm:px-3 py-1.5 inline-flex items-center gap-2 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300">
          <div className="w-5 h-5 rounded-[5px] bg-emerald-500/[0.15] border border-emerald-500/30 text-[#00E599] flex items-center justify-center shrink-0">
            <EyeOff className="w-2.5 h-2.5 stroke-[2.2]" />
          </div>
          <div className="text-left">
            <div className="text-[7px] sm:text-[7.5px] text-[#94A3B8] font-medium leading-none">Protection</div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-white mt-0.5 leading-tight">Always On</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityZeroTrackersCard() {
  return (
    <div className="relative group rounded-[18px] sm:rounded-[20px] bg-[#070b14] border border-white/[0.12] hover:border-purple-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_20px_50px_rgba(168,85,247,0.18)] p-3.5 sm:p-4 flex flex-col justify-between h-full transition-all duration-500 hover:-translate-y-1 overflow-hidden min-h-[205px] sm:min-h-[220px]">
      {/* Subtle ambient glass purple tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.06] via-transparent to-purple-500/[0.02] pointer-events-none rounded-[20px]" />

      {/* Background Illustration */}
      <img
        src="/security/zero-trackers.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none [mask-image:linear-gradient(to_right,transparent_15%,black_60%)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {/* Dark protective shield on left */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[68%] bg-gradient-to-r from-[#070b14]/95 from-45% via-[#070b14]/80 via-75% to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#070b14]/90 from-20% to-transparent pointer-events-none z-[1]" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center gap-1.5">
        <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-[6px] sm:rounded-[7px] bg-purple-500/[0.15] border border-purple-500/35 text-[#c084fc] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl group-hover:shadow-[0_0_14px_rgba(192,132,252,0.4)] transition-shadow duration-300">
          <EyeOff className="w-3 h-3 stroke-[2]" />
        </div>
        <span className="text-[9px] sm:text-[9.5px] font-bold tracking-[0.14em] text-[#c084fc] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          PRIVACY FIRST
        </span>
      </div>

      {/* Main Content - Consistent Top Margin matching Card 3 & Card 4 */}
      <div className="relative z-10 mt-2.5 sm:mt-3 space-y-1 max-w-[155px] sm:max-w-[170px] text-left">
        <h3 className="text-[16px] sm:text-[17.5px] font-bold text-white tracking-tight leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          No Trackers
        </h3>
        <p className="text-[10.5px] sm:text-[11.5px] text-[#CBD5E1] leading-relaxed font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          No ads, no tracking, no third-party SDKs.
        </p>
      </div>

      {/* Bottom Chip: Tracking None - mt-auto */}
      <div className="relative z-10 mt-auto pt-2.5">
        <div className="rounded-[11px] bg-[#0c1424]/90 hover:bg-[#0f1930]/95 border border-white/[0.12] hover:border-white/[0.22] px-2.5 sm:px-3 py-1.5 inline-flex items-center gap-2 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300">
          <div className="w-5 h-5 rounded-[5px] bg-purple-500/[0.15] border border-purple-500/30 text-[#c084fc] flex items-center justify-center shrink-0">
            <Shield className="w-2.5 h-2.5 stroke-[2.2]" />
          </div>
          <div className="text-left">
            <div className="text-[7px] sm:text-[7.5px] text-[#94A3B8] font-medium leading-none">Tracking</div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-white mt-0.5 leading-tight">None</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0, isHovered: false });
  const [user, setUser] = React.useState<{ email?: string; name?: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => setUser(null));
  }, []);

  const vaultLink = user ? "/vault" : "/signin?redirect=/vault";
  const walletLink = user ? "/wallet" : "/signin?redirect=/wallet";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14;
    setTilt({ x: y, y: x, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, isHovered: false });
  };

  return (
    <div className="relative space-y-10 sm:space-y-12 pt-0 pb-12 overflow-hidden bg-black">
      {/* 1. Hero Section (Two-Column Layout with 3D Glass Wallet Mockup) */}
      <section id="hero" className="relative max-w-7xl mx-auto pt-6 sm:pt-8 lg:pt-10 pb-0 sm:pb-1 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 xl:col-span-7 text-left space-y-5 lg:space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/10 px-3 py-1 text-[9px] sm:text-[10px] font-semibold text-neutral-300 tracking-[0.15em] uppercase backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
              <span>ONE WALLET. FOUR IDENTITY DOCUMENTS.</span>
            </div>

            {/* Bold Headline with Extruded 3D Isometric Text Shadow on Hover */}
            <div className="relative inline-block">
              <h1 className="isometric-3d-title text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-black tracking-tight leading-[1.16]">
                <span className="isometric-text">Your personal</span> <br />
                <span className="isometric-identity">
                  identity
                </span>{" "}
                <span className="isometric-text">
                  wallet.
                </span>
              </h1>
            </div>

            {/* Subtitle Description */}
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal max-w-lg">
              Store your <strong className="text-white font-semibold">Driving License (DL)</strong>, <strong className="text-white font-semibold">PAN Card</strong>,{" "}
              <strong className="text-white font-semibold">Voter ID (EPIC)</strong>, and <strong className="text-white font-semibold">Ration Card</strong> in a client-encrypted vault. Prove claims via signed, expiring, revocable QR tokens with zero raw PII leakage.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href={walletLink}
                className="group flex items-center gap-2.5 rounded-full bg-white hover:bg-neutral-100 text-black px-6 sm:px-7 py-3 text-xs sm:text-sm font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15),0_2px_6px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_24px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Wallet className="h-4 w-4 text-black" />
                <span>Open Wallet</span>
                <ArrowRight className="h-4 w-4 text-black/80 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2.5 rounded-full border border-white/[0.14] bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/[0.22] hover:text-white px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-neutral-200 active:scale-95 transition-all duration-200 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              >
                <Layers className="h-4 w-4 text-white/90" />
                <span>Explore Features</span>
              </a>
            </div>
          </div>

          {/* Right Column: 3D Stacked Glass Wallet Mockup (Interactive Hover & 3D Tilt) */}
          <div className="lg:col-span-5 xl:col-span-5 relative flex justify-center lg:justify-center items-center pt-2 lg:pt-0">
            {/* Mockup Card Interactive Area Wrapper */}
            <div
              className="group/stack relative w-full max-w-[335px] sm:max-w-[405px] lg:max-w-[435px] lg:-translate-x-8 xl:-translate-x-12 cursor-pointer perspective-1000 py-3"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Subtle Ambient Backing (Soft, no harsh glow) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[360px] h-[250px] sm:h-[320px] bg-blue-500/[0.07] group-hover/stack:bg-blue-500/[0.11] blur-3xl pointer-events-none rounded-full transition-colors duration-500" />

              {/* Stack Layer 4 (Left Peeking Curved Card Edge) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-md pointer-events-none shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(-12px, 6px, -40px) rotateX(${tilt.x * 0.4}deg) rotateY(${tilt.y * 0.4}deg) rotate(-7deg)`
                    : "translate3d(-8px, 4px, 0) rotate(-5deg)",
                  transition: tilt.isHovered ? "transform 0.14s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Stack Layer 3 (Furthest Back Glass Sheet) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.1] bg-white/[0.03] backdrop-blur-lg pointer-events-none shadow-[0_12px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(36px, -18px, -30px) rotateX(${tilt.x * 0.5}deg) rotateY(${tilt.y * 0.5}deg) rotate(6deg)`
                    : "translate3d(28px, -14px, 0) rotate(4.5deg)",
                  transition: tilt.isHovered ? "transform 0.14s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Stack Layer 2 (Middle Glass Sheet) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.12] bg-white/[0.04] backdrop-blur-xl pointer-events-none shadow-[0_14px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(24px, -12px, -20px) rotateX(${tilt.x * 0.65}deg) rotateY(${tilt.y * 0.65}deg) rotate(3.8deg)`
                    : "translate3d(18px, -9px, 0) rotate(2.5deg)",
                  transition: tilt.isHovered ? "transform 0.12s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Stack Layer 1 (Immediate Back Frosted Glass Sheet) */}
              <div
                className="absolute inset-0 rounded-[26px] border border-white/[0.14] bg-[#0c1220]/75 backdrop-blur-xl pointer-events-none shadow-[0_16px_36px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)]"
                style={{
                  transform: tilt.isHovered
                    ? `translate3d(13px, -6px, -10px) rotateX(${tilt.x * 0.8}deg) rotateY(${tilt.y * 0.8}deg) rotate(1.6deg)`
                    : "translate3d(9px, -4px, 0) rotate(0.5deg)",
                  transition: tilt.isHovered ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              />

              {/* Main Front Glass Wallet Device Card (Interactive 3D Tilt) */}
              <div
                className="relative z-10 w-full rounded-[26px] p-4 sm:p-5 bg-gradient-to-b from-[#131b2e]/85 via-[#0d1424]/80 to-[#080d18]/85 backdrop-blur-2xl border border-white/[0.15] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1.5px_1px_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(0,0,0,0.5)] group-hover/stack:border-white/[0.22] group-hover/stack:shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.5)]"
                style={{
                  transform: tilt.isHovered
                    ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotate(-0.5deg) scale3d(1.02, 1.02, 1.02)`
                    : "rotate(-2.5deg)",
                  transition: tilt.isHovered
                    ? "transform 0.08s ease-out, border-color 0.3s ease, box-shadow 0.3s ease"
                    : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s ease, box-shadow 0.5s ease",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3.5 sm:pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] group-hover/stack:scale-105 transition-transform duration-300">
                      <Wallet className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold tracking-wide text-white leading-tight">
                        WHITE <span className="text-[#38bdf8]">CARD</span>
                      </div>
                      <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.22em] text-neutral-400 font-bold leading-tight mt-0.5">
                        SECURE WALLET
                      </div>
                    </div>
                  </div>
                  <div className="text-neutral-400 hover:text-white transition p-1 cursor-pointer">
                    <MoreHorizontal className="h-5 w-5 text-neutral-300" />
                  </div>
                </div>

                {/* 2x2 Grid of 4 Supported Documents (iOS Glass Cells with Hover States) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {/* 1. Driving License */}
                  <Link
                    href={vaultLink}
                    className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2.5 sm:p-3 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <CarFront className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          Driving License
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1.5 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </Link>

                  {/* 2. PAN Card */}
                  <Link
                    href={vaultLink}
                    className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2.5 sm:p-3 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(124,58,237,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <FileText className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          PAN Card
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1.5 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </Link>

                  {/* 3. Voter ID */}
                  <Link
                    href={vaultLink}
                    className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2.5 sm:p-3 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <Vote className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          Voter ID
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1.5 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </Link>

                  {/* 4. Ration Card */}
                  <Link
                    href={vaultLink}
                    className="group/item rounded-[16px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.09] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.35)] p-2.5 sm:p-3 px-2.5 sm:px-3 flex items-center justify-between transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.015] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] shrink-0 group-hover/item:scale-105 transition-transform duration-200">
                        <Wheat className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap leading-tight">
                          Ration Card
                        </div>
                      </div>
                    </div>
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/[0.06] group-hover/item:bg-white/15 flex items-center justify-center text-neutral-400 group-hover/item:text-white shrink-0 ml-1.5 transition-all duration-200 group-hover/item:translate-x-0.5">
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </div>
                  </Link>
                </div>

                {/* Card Footer */}
                <div className="pt-3.5 sm:pt-4 pb-0 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-neutral-400 font-medium">
                  <Lock className="h-3 w-3 text-neutral-400" />
                  <span>4 documents · one secure wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Highlights (iOS Glass Squircles with Clean Dividers) */}
        <div className="pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 px-2">
          {/* 1. Client Encrypted */}
          <div className="flex items-center gap-4 flex-1">
            <div className="h-11 w-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-tight">Client Encrypted</div>
              <div className="text-xs text-neutral-400 leading-normal mt-0.5">Your data, your control</div>
            </div>
          </div>

          {/* Divider 1 */}
          <div className="hidden md:block h-9 w-px bg-white/10 shrink-0" aria-hidden="true" />

          {/* 2. Zero PII Leakage */}
          <div className="flex items-center gap-4 flex-1 md:justify-center">
            <div className="h-11 w-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-tight">Zero PII Leakage</div>
              <div className="text-xs text-neutral-400 leading-normal mt-0.5">Share only what&apos;s needed</div>
            </div>
          </div>

          {/* Divider 2 */}
          <div className="hidden md:block h-9 w-px bg-white/10 shrink-0" aria-hidden="true" />

          {/* 3. Fast & Secure */}
          <div className="flex items-center gap-4 flex-1 md:justify-end">
            <div className="h-11 w-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-tight">Fast & Secure</div>
              <div className="text-xs text-neutral-400 leading-normal mt-0.5">Instant, verifiable tokens</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Documents Section: All Your Important Documents, Together. */}
      <section id="documents" className="scroll-mt-28 space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-6 sm:pt-8 mt-6 sm:mt-8 overflow-hidden">
        {/* Section Header: Pill, Headline, Subtitle */}
        <div className="space-y-4 max-w-3xl text-left">
          {/* Pill Tag */}
          <div className="inline-flex items-center gap-2 rounded-full glass-ios-pill px-3.5 py-1 text-[11px] font-semibold text-neutral-300 tracking-wider uppercase">
            <span className="h-2 w-2 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff]" />
            <span>FOUR ESSENTIAL DOCUMENTS</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-white tracking-tight leading-[1.12]">
            All Your Important<br />
            Documents, <span className="text-[#2f86ff]">Together.</span>
          </h2>

          {/* Subtitle Paragraph */}
          <p className="text-[11px] sm:text-xs text-neutral-400 max-w-lg leading-relaxed">
            Store, manage and share your Driving License, PAN Card, Voter ID (EPIC) and Ration Card
            in one secure White Card wallet. Access only what&apos;s needed, whenever you need it.
          </p>
        </div>

        {/* 4 Supported Document Cards in 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <DocumentFeatureCard
            title="Driving License (DL)"
            description="Keep your driving license details safe and ready for verification."
            badgeText="DL"
            icon={<Car className="h-6 w-6 stroke-[1.9]" />}
            theme="blue"
            targetHref={vaultLink}
            pills={[
              { label: "Vehicle Details", icon: <Car className="h-3.5 w-3.5" /> },
              { label: "RTO Info", icon: <Building2 className="h-3.5 w-3.5" /> },
              { label: "Validity Date", icon: <Calendar className="h-3.5 w-3.5" /> },
              { label: "Issue State", icon: <MapPin className="h-3.5 w-3.5" /> },
            ]}
          />

          <DocumentFeatureCard
            title="PAN Card"
            description="Store your PAN details securely for financial and tax related services."
            badgeText="PAN"
            icon={<FileText className="h-6 w-6 stroke-[1.9]" />}
            theme="purple"
            targetHref={vaultLink}
            pills={[
              { label: "PAN Number", icon: <User className="h-3.5 w-3.5" /> },
              { label: "Name", icon: <CreditCard className="h-3.5 w-3.5" /> },
              { label: "Date of Birth", icon: <Calendar className="h-3.5 w-3.5" /> },
              { label: "Card Status", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
            ]}
          />

          <DocumentFeatureCard
            title="Voter ID (EPIC)"
            description="Keep your voter ID details safe for voting and identity verification."
            badgeText="VOTER ID"
            icon={<User className="h-6 w-6 stroke-[1.9]" />}
            theme="emerald"
            targetHref={vaultLink}
            pills={[
              { label: "EPIC Number", icon: <CreditCard className="h-3.5 w-3.5" /> },
              { label: "Constituency", icon: <Users className="h-3.5 w-3.5" /> },
              { label: "Polling Booth", icon: <Landmark className="h-3.5 w-3.5" /> },
              { label: "Issue Date", icon: <Calendar className="h-3.5 w-3.5" /> },
            ]}
          />

          <DocumentFeatureCard
            title="Ration Card"
            description="Store your ration card details for subsidized food and welfare benefits."
            badgeText="RATION"
            icon={<Wheat className="h-6 w-6 stroke-[1.9]" />}
            theme="amber"
            targetHref={vaultLink}
            pills={[
              { label: "Card Number", icon: <CreditCard className="h-3.5 w-3.5" /> },
              { label: "Head of Family", icon: <User className="h-3.5 w-3.5" /> },
              { label: "Family Members", icon: <Users className="h-3.5 w-3.5" /> },
              { label: "Category", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>
      </section>

      {/* 4. Section: How It Works */}
      <section id="how-it-works" className="scroll-mt-28 space-y-8 sm:space-y-9 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-4 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.14em] text-neutral-300 uppercase backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2f86ff] shadow-[0_0_8px_#2f86ff]" />
            <span>SIMPLE 3-STEP FLOW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-white tracking-tight leading-tight">
            How <span className="text-[#38bdf8]">White Card</span> Works
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Store your documents, choose what to share, and create a secure proof.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-3.5 justify-between">
          {/* Card 01: Add Your Documents */}
          <HowItWorksStepCard
            stepNumber="01"
            title={<>Add Your<br />Documents</>}
            description="Add your Driving License, PAN Card, Voter ID, and Ration Card to your White Card wallet. Your documents are securely protected."
            graphic={
              <div className="relative flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-13 sm:h-13 text-neutral-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                {/* Plus badge overlapping bottom-right corner */}
                <div className="absolute -bottom-1 -right-1 h-5.5 w-5.5 rounded-full bg-[#161822] border border-white/25 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  <Plus className="h-3.5 w-3.5 stroke-[2.8]" />
                </div>
              </div>
            }
          />

          {/* Desktop Arrow 1 */}
          <div className="hidden lg:flex shrink-0 h-9 w-9 rounded-full bg-white/[0.04] border border-white/10 items-center justify-center text-white/50 shadow-sm backdrop-blur-md">
            <ArrowRight className="h-4 w-4" />
          </div>
          {/* Mobile Arrow 1 */}
          <div className="flex lg:hidden items-center justify-center text-white/30 py-0.5">
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>

          {/* Card 02: Choose What to Share */}
          <HowItWorksStepCard
            stepNumber="02"
            title={<>Choose<br />What to Share</>}
            description="Select only the information you want to share. You can choose what the other person can see and how long it stays valid."
            graphic={<StepToggleGraphic />}
          />

          {/* Desktop Arrow 2 */}
          <div className="hidden lg:flex shrink-0 h-9 w-9 rounded-full bg-white/[0.04] border border-white/10 items-center justify-center text-white/50 shadow-sm backdrop-blur-md">
            <ArrowRight className="h-4 w-4" />
          </div>
          {/* Mobile Arrow 2 */}
          <div className="flex lg:hidden items-center justify-center text-white/30 py-0.5">
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>

          {/* Card 03: Share & Verify */}
          <HowItWorksStepCard
            stepNumber="03"
            title={<>Share &amp;<br />Verify</>}
            description="Create a secure QR code and share it. The receiver can scan the QR code and verify the selected information."
            graphic={
              <div className="relative flex items-center justify-center">
                <QrCode className="w-12 h-12 sm:w-13 sm:h-13 text-neutral-200 stroke-[1.6]" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-[#161822] border border-white/30 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-white stroke-[2.2]" />
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* 5. Section: Features (Everyday Privacy) */}
      <section id="features" className="scroll-mt-24 relative z-10 bg-black pt-8 sm:pt-12 pb-2 sm:pb-3 space-y-5 sm:space-y-6 max-w-[1100px] mx-auto px-4 sm:px-6 content-auto">
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/[0.12] px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-neutral-200 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#2997FF]" />
            <span>EVERYDAY PRIVACY POWERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-white tracking-tight leading-tight">
            Share what matters. <span className="text-[#2997FF]">Keep the rest private.</span>
          </h2>
          <p className="text-sm sm:text-[14.5px] text-[#8B9099] max-w-lg mx-auto leading-relaxed font-normal">
            White Card lets you share only the information you need,
            <br className="hidden sm:inline" /> with temporary access you control.
          </p>
        </div>

        {/* 2 Master Bento Cards (Exact Reference Match) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-4.5 items-stretch">
          <SelectiveDisclosureFeatureCard />
          <SelfDestructQRFeatureCard />
        </div>

        {/* Bottom Row: 3 Equal Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-4.5 items-stretch">
          <PasswordlessAuthFeatureCard />
          <InstantRevokeFeatureCard />
          <LiveAuditLogFeatureCard />
        </div>
      </section>

      {/* 6. Section: Security (Silicon Sealed Architecture) */}
      <section id="security" className="scroll-mt-24 relative z-10 bg-black pt-2 sm:pt-4 pb-12 sm:pb-16 space-y-5 sm:space-y-6 max-w-[1080px] mx-auto px-4 sm:px-6 content-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0d1527]/80 border border-[#1d2d47] px-3.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#cbd5e1] uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
            <span>FORTRESS-GRADE ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-white tracking-tight leading-tight">
            Sealed in Silicon. <span className="text-[#2997FF]">Owned by You.</span>
          </h2>
          <p className="text-xs sm:text-[13px] text-[#8B9099] max-w-lg mx-auto leading-relaxed font-normal">
            Your cryptographic keys never touch cloud servers in plaintext. If our servers vanished tomorrow, your documents remain impenetrable.
          </p>
        </div>

        {/* Top Row: 2 Architectural Master Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-4.5 items-stretch">
          <SecurityEnclaveMasterCard />
          <SecurityProofSealCard />
        </div>

        {/* Bottom Row: 3 Security Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-4.5 items-stretch">
          <SecurityShredderCard />
          <SecurityAntiReplayCard />
          <SecurityZeroTrackersCard />
        </div>
      </section>
    </div>
  );
}
