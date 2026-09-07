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
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-surface-card border border-surface-border p-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs animate-fade-in backdrop-blur-md">
      <div className="w-8 h-8 rounded-xl bg-indigo/15 text-indigo dark:text-steelteal flex items-center justify-center flex-shrink-0">
        <Cookie className="w-4 h-4" />
      </div>
      <div className="flex-1 text-midgrey dark:text-foggy/80 leading-relaxed text-[11px]">
        MailEven stores a single preference cookie to remember your theme and account filters. No tracking or third-party cookies are used.
      </div>
      <button
        onClick={handleDismiss}
        className="px-2.5 py-1 bg-indigo text-white dark:bg-steelteal text-[11px] font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        Got it
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-midgrey hover:text-charcoal dark:hover:text-foggy"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
