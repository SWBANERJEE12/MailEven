"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  Shield,
  Key,
  BellRing,
  Database,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Info,
  Calendar,
  CheckSquare,
  Mail,
} from "lucide-react";

interface SettingsViewProps {
  onRefreshData: () => void;
}

export default function SettingsView({ onRefreshData }: SettingsViewProps) {
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          <span>Settings & Diagnostics</span>
        </h2>
        <p className="text-xs text-muted-light mt-0.5">
          Configure Google APIs, Groq intelligence, and notification preferences.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-accent/15 border border-accent/30 rounded-xl text-xs text-accent font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Account & OAuth Status Card */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google OAuth & Permissions</h3>
              <p className="text-xs text-muted">
                {isDemo
                  ? "Running in Mock / Demo Mode"
                  : `Connected as ${session?.user?.email || "Google Account"}`}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isDemo
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {isDemo ? "Demo Account" : "OAuth Connected"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-surface-base border border-surface-borderSubtle flex items-center gap-2 text-xs">
            <Mail className="w-4 h-4 text-accent" />
            <div>
              <div className="font-semibold text-white">Gmail API</div>
              <div className="text-[10px] text-muted">https://mail.google.com/</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-base border border-surface-borderSubtle flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-accent" />
            <div>
              <div className="font-semibold text-white">Google Calendar</div>
              <div className="text-[10px] text-muted">calendar.events</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-base border border-surface-borderSubtle flex items-center gap-2 text-xs">
            <CheckSquare className="w-4 h-4 text-accent" />
            <div>
              <div className="font-semibold text-white">Google Tasks</div>
              <div className="text-[10px] text-muted">tasks scope</div>
            </div>
          </div>
        </div>
      </div>

      {/* Groq AI Status */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Groq AI Engine</h3>
            <p className="text-xs text-muted">
              Model: openai/gpt-oss-20b via Groq
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-light leading-relaxed">
          Emails are summarized into 1-2 executive sentences, assigned contextual tags, and evaluated for calendar blocks or action items. If GROQ_API_KEY is not supplied, MailEven automatically falls back to an intelligent heuristic NLP engine.
        </p>
      </div>

      {/* Ambient Notifications Card */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ambient Notifications</h3>
              <p className="text-xs text-muted">
                Status: {pushStatus === "granted" ? "Granted" : "In-App Fallback Active"}
              </p>
            </div>
          </div>
          {pushStatus !== "granted" && (
            <button
              onClick={requestPush}
              className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-accent/20"
            >
              Enable Browser Push
            </button>
          )}
        </div>
        <p className="text-xs text-muted-light leading-relaxed">
          When new emails arrive or sync completes, MailEven synthesizes a summary and dispatches a notification. If desktop push permission is denied, all notifications seamlessly appear in the top-bar notification bell.
        </p>
      </div>

      {/* Mock Data / Reset Card */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sample Data & Demo Seeder</h3>
            <p className="text-xs text-muted">
              Explore the full interactive UI before connecting production credentials.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => handleSeedAction("seed")}
            disabled={isSeeding}
            className="px-4 py-2 bg-surface-elevated hover:bg-surface-border border border-surface-border text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Re-seed Sample Emails
          </button>
          <button
            onClick={() => handleSeedAction("reset")}
            disabled={isSeeding}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl transition-colors"
          >
            Reset All Database Records
          </button>
        </div>
      </div>

      {/* Setup Guide for Google Cloud */}
      <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Info className="w-4 h-4 text-accent" />
          <span>How to Connect Your Real Google Account</span>
        </div>
        <ol className="list-decimal list-inside text-xs text-muted-light space-y-2 leading-relaxed">
          <li>
            Go to{" "}
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline inline-flex items-center gap-1"
            >
              Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>{" "}
            and create or select a project.
          </li>
          <li>
            Enable the <strong className="text-white">Gmail API</strong>,{" "}
            <strong className="text-white">Google Calendar API</strong>, and{" "}
            <strong className="text-white">Google Tasks API</strong> under Enabled APIs & Services.
          </li>
          <li>
            Configure the <strong className="text-white">OAuth consent screen</strong> with scopes:{" "}
            <code className="text-accent bg-surface-base px-1 rounded">gmail.readonly</code>,{" "}
            <code className="text-accent bg-surface-base px-1 rounded">calendar.events</code>, and{" "}
            <code className="text-accent bg-surface-base px-1 rounded">tasks</code>.
          </li>
          <li>
            Create an <strong className="text-white">OAuth 2.0 Client ID (Web application)</strong> with Authorized redirect URI:{" "}
            <code className="text-white bg-surface-base px-1.5 py-0.5 rounded border border-surface-border">
              http://localhost:3000/api/auth/callback/google
            </code>
          </li>
          <li>
            Copy your Client ID and Client Secret into <code className="text-accent">.env.local</code> and restart the app.
          </li>
        </ol>
      </div>
    </div>
  );
}
