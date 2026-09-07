import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function MailEvenLogo({ className = "", size = 32, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden bg-surface-card p-1 border border-white/10"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="MailEven"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className="font-bold tracking-tight text-white flex items-center text-lg">
          Mail<span className="text-accent">Even</span>
        </span>
      )}
    </div>
  );
}
