"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import MailEvenLogo from "./MailEvenLogo";
import NotificationBell from "./NotificationBell";
import {
  Menu,
  RefreshCw,
  Search,
  Database,
  CheckCircle2,
} from "lucide-react";

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectEmail?: (id: string) => void;
  onRefreshData?: () => void;
}

export default function Navbar({
  onOpenMobileSidebar,
  onSync,
  isSyncing,
  searchQuery,
  setSearchQuery,
  onSelectEmail,
  onRefreshData,
}: NavbarProps) {
  const { data: session } = useSession();
  const [showSeedMenu, setShowSeedMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isDemo = (session?.user as any)?.isDemo ?? false;

  const handleSeedAction = async (action: "seed" | "reset") => {
    setIsResetting(true);
    try {
      await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setShowSeedMenu(false);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-card/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Hamburger & Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Logo Fallback */}
          <div className="md:hidden">
            <MailEvenLogo size={28} showText={false} />
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search summaries, senders, tags..."
              className="w-full bg-surface-elevated border border-surface-borderSubtle text-xs rounded-xl pl-10 pr-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Right Tools: Mock Data, Sync, Notification Bell */}
        <div className="flex items-center gap-2.5">
          {/* Demo Mode / Dataset Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSeedMenu(!showSeedMenu)}
              className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                isDemo
                  ? "bg-accent/15 text-accent border-accent/30 hover:opacity-90"
                  : "bg-surface-elevated border-surface-borderSubtle text-muted hover:text-foreground"
              }`}
              title="Mock dataset manager"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isDemo ? "Demo Data" : "Live Mode"}</span>
            </button>

            {showSeedMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-surface-border rounded-2xl shadow-xl z-50 p-2 text-xs animate-fade-in">
                <div className="px-2.5 py-1 text-muted text-[10px] uppercase tracking-wider font-bold">
                  Mock Data Manager
                </div>
                <button
                  onClick={() => handleSeedAction("seed")}
                  disabled={isResetting}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-foreground hover:bg-surface-elevated transition-colors"
                >
                  Re-seed Dual Accounts & Emails
                </button>
                <button
                  onClick={() => handleSeedAction("reset")}
                  disabled={isResetting}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-red-500 hover:bg-surface-elevated transition-colors"
                >
                  Reset to Fresh Dataset
                </button>
              </div>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-surface-highlight border border-surface-borderSubtle rounded-xl text-xs font-semibold text-foreground transition-colors disabled:opacity-50"
            title="Sync the latest 50 Inbox emails from each connected account"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-accent ${isSyncing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>

          {/* Notification Bell */}
          <NotificationBell onSelectEmail={onSelectEmail} />
        </div>
      </div>
    </header>
  );
}
