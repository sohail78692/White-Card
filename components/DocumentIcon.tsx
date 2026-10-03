import React from "react";
import { CarFront, FileText, Vote, Wheat, IdCard, CreditCard } from "lucide-react";
import { DocumentType } from "@/lib/validators/documents";

interface DocumentIconProps {
  type: DocumentType | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DocumentIcon({ type, size = "md", className = "" }: DocumentIconProps) {
  let gradient = "from-[#2563eb] to-[#1d4ed8]";
  let shadow = "shadow-[0_2px_8px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]";
  let IconComponent = CarFront;

  switch (type) {
    case "DRIVING_LICENSE":
      gradient = "from-[#2563eb] to-[#1d4ed8]";
      shadow = "shadow-[0_2px_8px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]";
      IconComponent = CarFront;
      break;
    case "PAN":
      gradient = "from-[#7c3aed] to-[#6366f1]";
      shadow = "shadow-[0_2px_8px_rgba(124,58,237,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]";
      IconComponent = FileText;
      break;
    case "VOTER_ID":
      gradient = "from-[#10b981] to-[#059669]";
      shadow = "shadow-[0_2px_8px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]";
      IconComponent = Vote;
      break;
    case "RATION_CARD":
      gradient = "from-[#f59e0b] to-[#d97706]";
      shadow = "shadow-[0_2px_8px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]";
      IconComponent = Wheat;
      break;
    case "RANDOM":
      gradient = "from-[#ec4899] to-[#be185d]";
      shadow = "shadow-[0_2px_8px_rgba(236,72,153,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]";
      IconComponent = IdCard;
      break;
    default:
      gradient = "from-[#475569] to-[#334155]";
      shadow = "shadow-sm";
      IconComponent = CreditCard;
  }

  const sizeClasses = {
    sm: "h-7 w-7 rounded-lg text-xs",
    md: "h-9 w-9 rounded-xl text-sm",
    lg: "h-11 w-11 rounded-2xl text-base",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
    lg: "h-5 w-5",
  }[size];

  return (
    <div
      className={`bg-gradient-to-br ${gradient} ${shadow} ${sizeClasses} flex items-center justify-center text-white shrink-0 transition-transform duration-200 ${className}`}
    >
      <IconComponent className={iconSizes} />
    </div>
  );
}
