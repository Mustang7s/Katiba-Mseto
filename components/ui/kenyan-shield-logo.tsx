"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface KenyanShieldLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  href?: string;
  variant?: "header" | "footer" | "hero";
}

export function KenyanShieldLogo({
  size = "md",
  showText = true,
  className,
  href = "/",
  variant = "header",
}: KenyanShieldLogoProps) {
  const sizeMap = {
    sm: { dimension: 28, textClass: "text-lg", badgeClass: "text-[10px] px-1.5 py-0.2" },
    md: { dimension: 38, textClass: "text-2xl", badgeClass: "text-xs px-2 py-0.5" },
    lg: { dimension: 52, textClass: "text-3xl", badgeClass: "text-sm px-2.5 py-0.5" },
    xl: { dimension: 80, textClass: "text-5xl", badgeClass: "text-base px-3 py-1" },
  };

  const { dimension, textClass, badgeClass } = sizeMap[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group cursor-pointer select-none", className)}>
      {/* Authentic Kenyan Maasai Shield Icon with Crossed Spears */}
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Crossed Spears */}
          <line x1="26" y1="26" x2="174" y2="174" stroke="#4B5563" strokeWidth="6" strokeLinecap="round" />
          <path d="M16 16 L38 24 L24 38 Z" fill="#E5E7EB" stroke="#1F2937" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 16 L30 30" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="174" y1="26" x2="26" y2="174" stroke="#4B5563" strokeWidth="6" strokeLinecap="round" />
          <path d="M184 16 L162 24 L176 38 Z" fill="#E5E7EB" stroke="#1F2937" strokeWidth="2" strokeLinejoin="round" />
          <path d="M184 16 L170 30" stroke="#FFFFFF" strokeWidth="2" />

          {/* Maasai Shield Body */}
          <path
            d="M100 18 C148 48, 154 152, 100 182 C46 152, 52 48, 100 18 Z"
            fill="#111827"
            stroke="#1F2937"
            strokeWidth="3"
          />

          {/* Red Central Swathe */}
          <path
            d="M100 20 C125 50, 128 150, 100 180 C72 150, 75 50, 100 20 Z"
            fill="#CE1126"
          />

          {/* White Border Contours */}
          <path d="M100 23 C118 53, 121 147, 100 177" stroke="#FFFFFF" strokeWidth="4" fill="none" />
          <path d="M100 23 C82 53, 79 147, 100 177" stroke="#FFFFFF" strokeWidth="4" fill="none" />

          {/* Central Ridge and Boss */}
          <line x1="100" y1="21" x2="100" y2="179" stroke="#FFFFFF" strokeWidth="3" />
          <ellipse cx="100" cy="100" rx="9" ry="12" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
          <ellipse cx="100" cy="100" rx="4" ry="6" fill="#CE1126" />

          {/* Traditional Maasai Geometric Dots */}
          <circle cx="84" cy="72" r="3.5" fill="#FFFFFF" />
          <circle cx="82" cy="90" r="3.5" fill="#FFFFFF" />
          <circle cx="82" cy="110" r="3.5" fill="#FFFFFF" />
          <circle cx="84" cy="128" r="3.5" fill="#FFFFFF" />

          <circle cx="116" cy="72" r="3.5" fill="#FFFFFF" />
          <circle cx="118" cy="90" r="3.5" fill="#FFFFFF" />
          <circle cx="118" cy="110" r="3.5" fill="#FFFFFF" />
          <circle cx="116" cy="128" r="3.5" fill="#FFFFFF" />

          {/* Kenyan Forest Green Accents */}
          <path d="M78 142 C85 148, 115 148, 122 142" stroke="#0A7B24" strokeWidth="5" strokeLinecap="round" />
          <path d="M82 58 C88 52, 112 52, 118 58" stroke="#0A7B24" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={cn("font-extrabold tracking-tight flex items-baseline leading-none", textClass)}>
            <span className={variant === "footer" ? "text-white" : "text-[#0A7B24]"}>
              Katiba
            </span>
            <span className="text-[#CE1126] ml-1">
              Mseto
            </span>
            {/* Kenya Flag Tricolor Accent Bar */}
            <span className="ml-1.5 flex flex-col gap-0.5 justify-center self-center" aria-hidden="true">
              <span className="w-2.5 h-0.5 bg-black rounded-full" />
              <span className="w-2.5 h-0.5 bg-[#CE1126] rounded-full" />
              <span className="w-2.5 h-0.5 bg-[#0A7B24] rounded-full" />
            </span>
          </div>
          <span
            className={cn(
              "font-medium tracking-wide uppercase text-[10px] mt-0.5",
              variant === "footer" ? "text-gray-300" : "text-[#4B5563]"
            )}
          >
            Katiba ya Kenya • 2010
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Katiba Mseto Home">
        {content}
      </Link>
    );
  }

  return content;
}

