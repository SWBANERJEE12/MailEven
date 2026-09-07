"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  Shield,
  BellRing,
  Database,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Info,
  Calendar,
  CheckSquare,
  Mail,
  Lock,
} from "lucide-react";

interface SettingsViewProps {
  onRefreshData: () => void;
  onNavigateToPrivacy?: () => void;
}

export default function SettingsView({ onRefreshData, onNavigateToPrivacy }: SettingsViewProps) {
  const { data: session } = useSession();
  const [isSeeding, setIsSeeding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string>("default");

  const isDemo = (session?.user as any)?.isDemo ?? false;

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const handleSeedAction = async (action: "seed" | "reset") => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setFeedback(data.message || "Action completed.");
      onRefreshData();
    } catch (e: any) {
      setFeedback("Error: " + e.message);
    } finally {
      setIsSeeding(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const requestPush = async () => {
    if (!("Notification" in window)) {
      alert("Push notifications not supported in this browser.");
      return;
    }
    const perm = await Notification.requestPermission();
    setPushStatus(perm);
    if (perm === "granted") {
      new Notification("MailEven Push Notifications Enabled", {
        body: "You are all set to receive ambient email briefings!",
        icon: "/logo.png",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo dark:text-steelteal" />
          <span>Settings & Diagnostics</span>
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Configure Google APIs, Gemini intelligence, and notification preferences.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-indigo/10 dark:bg-steelteal/15 border border-indigo/20 dark:border-steelteal/30 rounded-xl text-xs text-indigo dark:text-steelteal font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Account & OAuth Status Card */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center justify-center text-indigo dark:text-steelteal">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Google OAuth & Permissions</h3>
              <p className="text-xs text-muted">
                {isDemo
                  ? "Running in Multi-Account Demo Mode (Work + Personal)"
                  : `Primary Google Account: ${session?.user?.email || "Google Account"}`}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isDemo
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {isDemo ? "Demo Accounts" : "OAuth Connected"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-surface-elevated border border-surface-borderSubtle flex items-center gap-2 text-xs">
            <Mail className="w-4 h-4 text-indigo dark:text-steelteal" />
            <div>
              <div className="font-semibold text-foreground">Gmail API</div>
              <div className="text-[10px] text-muted">gmail.readonly</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-surface-borderSubtle flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-indigo dark:text-steelteal" />
            <div>
              <div className="font-semibold text-foreground">Google Calendar</div>
              <div className="text-[10px] text-muted">calendar.events</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-surface-borderSubtle flex items-center gap-2 text-xs">
            <CheckSquare className="w-4 h-4 text-indigo dark:text-steelteal" />
            <div>
              <div className="font-semibold text-foreground">Google Tasks</div>
              <div className="text-[10px] text-muted">tasks scope</div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-surface-borderSubtle flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tokens encrypted at rest via AES-256-GCM (TOKEN_ENCRYPTION_KEY)</span>
          </span>
          {onNavigateToPrivacy && (
            <button
              onClick={onNavigateToPrivacy}
              className="text-indigo dark:text-steelteal font-semibold hover:underline"
            >
              Manage Privacy & Data
            </button>
          )}
        </div>
      </div>

      {/* Gemini AI Status */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center justify-center text-indigo dark:text-steelteal">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Gemini AI Engine</h3>
            <p className="text-xs text-muted">Summarization & Event Extraction</p>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Emails are summarized into 1–2 executive sentences, assigned contextual tags, and evaluated for calendar blocks or action items. Strict zero-retention policy applies: raw content is never used for training models.
        </p>
      </div>

      {/* Ambient Notifications Card */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center justify-center text-indigo dark:text-steelteal">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Ambient Notifications</h3>
              <p className="text-xs text-muted">
                Status: {pushStatus === "granted" ? "Browser Push Granted" : "In-App Bell Fallback Active"}
              </p>
            </div>
          </div>
          {pushStatus !== "granted" && (
            <button
              onClick={requestPush}
              className="px-3.5 py-1.5 bg-indigo text-white dark:bg-steelteal text-xs font-semibold rounded-xl transition-opacity hover:opacity-90 shadow-sm"
            >
              Enable Browser Push
            </button>
          )}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          When new emails arrive or sync completes, MailEven synthesizes a summary and dispatches a notification. If desktop push permission is denied, all notifications seamlessly appear in the top-bar notification bell.
        </p>
      </div>

      {/* Mock Data / Reset Card */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center justify-center text-indigo dark:text-steelteal">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Sample Data & Demo Seeder</h3>
            <p className="text-xs text-muted">
              Pre-configured dual accounts (Work + Personal) with interleaved correspondence.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => handleSeedAction("seed")}
            disabled={isSeeding}
            className="px-4 py-2 bg-surface-elevated hover:bg-surface-highlight border border-surface-borderSubtle text-foreground text-xs font-semibold rounded-xl transition-colors"
          >
            Re-seed Dual Demo Accounts
          </button>
          <button
            onClick={() => handleSeedAction("reset")}
            disabled={isSeeding}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-semibold rounded-xl transition-colors"
          >
            Reset All Database Records
          </button>
        </div>
      </div>

      {/* Setup Guide for Google Cloud */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Info className="w-4 h-4 text-indigo dark:text-steelteal" />
          <span>Connecting Live Google Accounts</span>
        </div>
        <ol className="list-decimal list-inside text-xs text-muted space-y-2 leading-relaxed">
          <li>
            Open{" "}
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo dark:text-steelteal underline inline-flex items-center gap-1 font-semibold"
            >
              Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>{" "}
            and create or select a project.
          </li>
          <li>
            Enable the <strong className="text-foreground">Gmail API</strong>,{" "}
            <strong className="text-foreground">Google Calendar API</strong>, and{" "}
            <strong className="text-foreground">Google Tasks API</strong>.
          </li>
          <li>
            Configure OAuth consent screen with scopes:{" "}
            <code className="text-foreground bg-surface-elevated px-1 py-0.5 rounded">gmail.readonly</code>,{" "}
            <code className="text-foreground bg-surface-elevated px-1 py-0.5 rounded">calendar.events</code>, and{" "}
            <code className="text-foreground bg-surface-elevated px-1 py-0.5 rounded">tasks</code>.
          </li>
          <li>
            Create OAuth 2.0 Client ID (Web application) with Authorized redirect URI:{" "}
            <code className="text-foreground bg-surface-elevated px-1.5 py-0.5 rounded border border-surface-borderSubtle">
              http://localhost:3000/api/auth/callback/google
            </code>
          </li>
          <li>
            Add additional accounts anytime by clicking <strong className="text-foreground">"Add Account"</strong> in the sidebar.
          </li>
        </ol>
      </div>
    </div>
  );
}
