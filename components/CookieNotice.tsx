"use client";

import React, { useState, useEffect } from "react";
import { getPreferencesClient, setPreferencesClient } from "@/lib/cookies";
import { Cookie, X } from "lucide-react";

export default function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefs = getPreferencesClient();
    if (!prefs.dismissedCookieNotice) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setPreferencesClient({ dismissedCookieNotice: true });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-surface-card border border-surface-border p-3.5 rounded-xl shadow-xl flex items-center gap-3 text-xs animate-fade-in backdrop-blur-md">
      <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
        <Cookie className="w-4 h-4" strokeWidth={1.8} />
      </div>
      <div className="flex-1 text-muted leading-relaxed text-[11px]">
        MailEven stores a single preference cookie for theme and account filter selection. No tracking or ad cookies are used.
      </div>
      <button
        onClick={handleDismiss}
        className="px-2.5 py-1 bg-accent text-white text-[11px] font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        Acknowledge
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-muted hover:text-foreground"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}
