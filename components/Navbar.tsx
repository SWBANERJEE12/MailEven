"use client";

import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import MailEvenLogo from "./MailEvenLogo";
import NotificationBell from "./NotificationBell";
import {
  Inbox,
  Sparkles,
  CalendarCheck,
  Settings,
  RefreshCw,
  Search,
  LogOut,
  Sliders,
  Database,
  CheckCircle2,
} from "lucide-react";

interface NavbarProps {
  activeTab: "inbox" | "briefing" | "calendar-tasks" | "settings";
  setActiveTab: (tab: "inbox" | "briefing" | "calendar-tasks" | "settings") => void;
  briefingCount: number;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectEmail?: (id: string) => void;
  onRefreshData?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  briefingCount,
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
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("inbox")}
            className="focus:outline-none flex items-center"
          >
            <MailEvenLogo size={36} />
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-surface-border">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "inbox"
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "text-muted-light hover:text-white hover:bg-surface-elevated"
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Inbox</span>
            </button>

            <button
              onClick={() => setActiveTab("briefing")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === "briefing"
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "text-muted-light hover:text-white hover:bg-surface-elevated"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Daily Briefing</span>
              {briefingCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === "briefing"
                      ? "bg-white text-accent"
                      : "bg-accent text-white"
                  }`}
                >
                  {briefingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("calendar-tasks")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "calendar-tasks"
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "text-muted-light hover:text-white hover:bg-surface-elevated"
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Calendar & Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "text-muted-light hover:text-white hover:bg-surface-elevated"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Center Search (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-1 max-w-xs relative items-center">
          <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search summaries, senders, tags..."
            className="w-full bg-surface-card border border-surface-border text-xs rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-3">
          {/* Demo Toggle & Seed Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSeedMenu(!showSeedMenu)}
              className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                isDemo
                  ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
                  : "bg-surface-card border-surface-border text-muted-light hover:text-white"
              }`}
              title="Toggle seed data & demo state"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isDemo ? "Demo Mode" : "Live Google"}</span>
            </button>

            {showSeedMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-surface-border rounded-xl shadow-xl z-50 p-2 text-xs">
                <div className="px-2 py-1 text-muted text-[10px] uppercase tracking-wider font-bold">
                  Mock Data Manager
                </div>
                <button
                  onClick={() => handleSeedAction("seed")}
                  disabled={isResetting}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-foreground hover:bg-surface-elevated transition-colors"
                >
                  Seed Sample Emails
                </button>
                <button
                  onClick={() => handleSeedAction("reset")}
                  disabled={isResetting}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-surface-elevated transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card hover:bg-surface-elevated border border-surface-border rounded-xl text-xs font-semibold text-foreground hover:text-white transition-colors disabled:opacity-50"
            title="Sync latest emails & generate AI summaries"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-accent ${isSyncing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>

          {/* Notification Bell */}
          <NotificationBell onSelectEmail={onSelectEmail} />

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
            <div className="w-8 h-8 rounded-full bg-surface-elevated border border-surface-border overflow-hidden flex items-center justify-center text-xs font-bold text-accent">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                session?.user?.name?.[0] || "U"
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 text-muted hover:text-red-400 transition-colors rounded-lg"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar for Navigation */}
      <div className="md:hidden flex items-center justify-around border-t border-surface-border bg-black/90 py-2 px-4">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            activeTab === "inbox" ? "text-accent" : "text-muted"
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Inbox</span>
        </button>
        <button
          onClick={() => setActiveTab("briefing")}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium relative ${
            activeTab === "briefing" ? "text-accent" : "text-muted"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Briefing</span>
          {briefingCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {briefingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("calendar-tasks")}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            activeTab === "calendar-tasks" ? "text-accent" : "text-muted"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Actions</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            activeTab === "settings" ? "text-accent" : "text-muted"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
