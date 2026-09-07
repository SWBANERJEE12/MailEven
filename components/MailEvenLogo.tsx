import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function MailEvenLogo({ className = "", size = 32, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden bg-surface-card p-1 border border-surface-border shadow-sm"
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
        <span className="font-bold tracking-tight text-foreground flex items-center text-base sm:text-lg">
          Mail<span className="text-accent font-extrabold ml-0.5">Even</span>
        </span>
      )}
    </div>
  );
}
