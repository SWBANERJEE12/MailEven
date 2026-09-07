"use client";

import React, { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import MailEvenLogo from "./MailEvenLogo";
import {
  Inbox,
  Sparkles,
  FileText,
  CalendarCheck,
  ShieldCheck,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Check,
  Plus,
  Tag as TagIcon,
  X,
  Users,
  Send,
  LayoutGrid,
} from "lucide-react";
import { getPreferencesClient, setPreferencesClient } from "@/lib/cookies";

export interface ConnectedAccountData {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  color?: string | null;
  initials?: string | null;
  isPrimary?: boolean;
}

const AVAILABLE_TAGS = [
  "All",
  "Urgent",
  "Work",
  "Personal",
  "Finance",
  "Travel",
  "Newsletters",
  "Promotions",
];

const TAG_COLORS: Record<string, string> = {
  All: "bg-accent",
  Urgent: "bg-red-500",
  Work: "bg-accent",
  Personal: "bg-stardust",
  Finance: "bg-emerald-500",
  Travel: "bg-sky-500",
  Newsletters: "bg-violet-500",
  Promotions: "bg-amber-500",
};

interface SidebarProps {
  activeTab: "inbox" | "briefing" | "priority-grid" | "summary" | "calendar-tasks" | "privacy" | "settings";
  setActiveTab: (tab: "inbox" | "briefing" | "priority-grid" | "summary" | "calendar-tasks" | "privacy" | "settings") => void;
  briefingCount: number;
  inboxCount: number;
  accounts: ConnectedAccountData[];
  selectedAccountId: string; // "all" or specific account ID
  setSelectedAccountId: (accId: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onAddAccount: () => void;
  onCompose: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  briefingCount,
  inboxCount,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  selectedTag,
  setSelectedTag,
  isMobileOpen,
  setIsMobileOpen,
  onAddAccount,
  onCompose,
}: SidebarProps) {
  const { data: session } = useSession();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize theme on client mount to avoid SSR hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    const pref = getPreferencesClient().theme;
    if (pref === "light") {
      setCurrentTheme("light");
    } else if (pref === "dark") {
      setCurrentTheme("dark");
    } else if (window.matchMedia && !window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setCurrentTheme("light");
    } else {
      setCurrentTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(nextTheme);
    setPreferencesClient({ theme: nextTheme });
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setPreferencesClient({ lastActiveAccount: id });
    setIsAccountMenuOpen(false);
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setPreferencesClient({ lastTagFilter: tag });
    if (activeTab !== "inbox" && activeTab !== "briefing") {
      setActiveTab("inbox");
    }
  };

  const selectedAccount =
    selectedAccountId === "all"
      ? null
      : accounts.find((a) => a.id === selectedAccountId || a.email === selectedAccountId);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface-card border-r border-surface-border flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Mobile Close */}
          <div className="h-16 px-5 border-b border-surface-border flex items-center justify-between flex-shrink-0">
            <MailEvenLogo size={32} />
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 text-muted hover:text-foreground rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connected Account Switcher */}
          <div className="p-3 border-b border-surface-border relative flex-shrink-0">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="w-full p-2.5 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-surface-borderSubtle flex items-center justify-between gap-2.5 transition-colors text-left"
              title="Switch connected account"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedAccount ? (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: selectedAccount.color || "#A78D78" }}
                  >
                    {selectedAccount.initials || selectedAccount.email.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <Users className="w-4 h-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground truncate">
                    {selectedAccount ? selectedAccount.name || selectedAccount.email : "All Accounts"}
                  </div>
                  <div className="text-[10px] text-muted truncate">
                    {selectedAccount ? selectedAccount.email : `${accounts.length} linked accounts`}
                  </div>
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-muted flex-shrink-0 transition-transform duration-150 ${
                  isAccountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Account Switcher Dropdown */}
            {isAccountMenuOpen && (
              <div className="absolute top-full left-3 right-3 mt-1 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 p-2 text-xs animate-fade-in backdrop-blur-md">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted tracking-wider">
                  Select Account Feed
                </div>

                {/* All Accounts Option */}
                <button
                  onClick={() => handleSelectAccount("all")}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                    selectedAccountId === "all"
                      ? "bg-surface-elevated text-foreground font-bold"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-[10px]">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">All Accounts (Interleaved)</span>
                  </div>
                  {selectedAccountId === "all" && <Check className="w-4 h-4 text-accent" />}
                </button>

                {/* Individual Accounts */}
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id || selectedAccountId === acc.email;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleSelectAccount(acc.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-surface-elevated text-foreground font-bold"
                          : "text-muted hover:text-foreground hover:bg-surface-elevated/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: acc.color || "#A78D78" }}
                        >
                          {acc.initials || acc.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="truncate text-foreground text-xs">{acc.name || acc.email}</div>
                          <div className="truncate text-muted text-[10px]">{acc.email}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-accent" />}
                    </button>
                  );
                })}

                <div className="border-t border-surface-borderSubtle mt-1.5 pt-1.5">
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onAddAccount();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-accent hover:bg-surface-elevated transition-colors text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Google Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Compose / Send Email Action Button */}
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => {
                setIsMobileOpen(false);
                onCompose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white hover:opacity-90 active:scale-[0.98] transition-all text-xs font-bold shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>New Email</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab("inbox");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "inbox"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-4 h-4" />
                <span>Inbox</span>
              </div>
              {inboxCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "inbox"
                      ? "bg-white/20 text-white"
                      : "bg-surface-elevated text-muted"
                  }`}
                >
                  {inboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("briefing");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "briefing"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4" />
                <span>Daily Briefing</span>
              </div>
              {briefingCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "briefing"
                      ? "bg-white text-foreground"
                      : "bg-accent/20 text-accent"
                  }`}
                >
                  {briefingCount}
                </span>
              )}
            </button>

            {/* Urgency & Deadline Grid Nav Link */}
            <button
              onClick={() => {
                setActiveTab("priority-grid");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "priority-grid"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4" />
                <span>Urgency Grid</span>
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                  activeTab === "priority-grid"
                    ? "bg-white/20 text-white"
                    : "bg-red-500/15 text-red-500 dark:text-red-400"
                }`}
              >
                Tiles
              </span>
            </button>

            {/* AI Summary View Nav Link */}
            <button
              onClick={() => {
                setActiveTab("summary");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "summary"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>AI Summary</span>
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                  activeTab === "summary"
                    ? "bg-white/20 text-white"
                    : "bg-accent/15 text-accent"
                }`}
              >
                Day / Week
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("calendar-tasks");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "calendar-tasks"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Calendar & Tasks</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("privacy");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "privacy"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy & Security</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Tag Filters (Sidebar based) */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
              <TagIcon className="w-3 h-3 text-accent" />
              <span>Filter by Tag</span>
            </div>
            <div className="space-y-0.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTag === tag;
                const dotColor = TAG_COLORS[tag] || "bg-muted";
                return (
                  <button
                    key={tag}
                    onClick={() => handleSelectTag(tag)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? "bg-surface-elevated text-foreground font-bold"
                        : "text-muted hover:text-foreground hover:bg-surface-elevated/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span>{tag}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Theme Toggle & User Info */}
        <div className="p-3 border-t border-surface-border space-y-2 flex-shrink-0">
          {/* Light / Dark Mode Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-elevated border border-surface-borderSubtle text-xs">
            <div className="flex items-center gap-2 text-muted">
              {isMounted && currentTheme === "dark" ? (
                <Moon className="w-4 h-4 text-accent" />
              ) : (
                <Sun className="w-4 h-4 text-accent" />
              )}
              <span className="capitalize">{isMounted ? currentTheme : "Dark"} Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-lg bg-surface-card hover:bg-surface-highlight text-foreground border border-surface-border text-[11px] font-semibold transition-colors"
            >
              Switch to {currentTheme === "dark" ? "Light" : "Dark"}
            </button>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-base">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-elevated border border-surface-border overflow-hidden flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  session?.user?.name?.[0] || "A"
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">
                  {session?.user?.name || "Alex Chen"}
                </div>
                <div className="text-[10px] text-muted truncate">
                  {session?.user?.email || "demo@maileven.ai"}
                </div>
              </div>
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
      </aside>
    </>
  );
}
