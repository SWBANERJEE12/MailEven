"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  Server,
  Layers,
  Database,
  Unlink,
} from "lucide-react";
import { ConnectedAccountData } from "./Sidebar";

interface PrivacyPanelProps {
  accounts: ConnectedAccountData[];
  onRefreshData: () => void;
}

interface RetentionStats {
  retentionDays: number;
  totalEmails: number;
  rawBodiesStored: number;
  purgedBodiesCount: number;
}

export default function PrivacyPanel({ accounts, onRefreshData }: PrivacyPanelProps) {
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [isPurging, setIsPurging] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [revokingAccountId, setRevokingAccountId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/privacy/purge");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setRetentionDays(data.retentionDays || 30);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleExportData = () => {
    window.location.href = "/api/privacy/export";
    showFeedback("Initiated local data export (JSON).");
  };

  const handlePurgeBodies = async () => {
    setIsPurging(true);
    try {
      const res = await fetch("/api/privacy/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: retentionDays, updateSetting: true }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Email bodies purged successfully.");
        await fetchStats();
        onRefreshData();
      } else {
        showFeedback(data.error || "Failed to purge bodies.", "error");
      }
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setIsPurging(false);
    }
  };

  const handleRevokeAccount = async (accountId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke and disconnect ${email}? This will revoke Google OAuth tokens server-side and purge all local emails and actions for this account.`)) {
      return;
    }

    setRevokingAccountId(accountId);
    try {
      const res = await fetch("/api/accounts/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Account revoked and local records purged.");
        onRefreshData();
      } else {
        showFeedback(data.error || "Failed to revoke account.", "error");
      }
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setRevokingAccountId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("CAUTION: This will permanently wipe all local emails, summaries, calendar events, tasks, and notification logs from SQLite. Are you sure you want to proceed?")) {
      return;
    }

    setIsDeletingAll(true);
    try {
      const res = await fetch("/api/privacy/delete-all", {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "All local records permanently deleted.");
        await fetchStats();
        onRefreshData();
      } else {
        showFeedback(data.error || "Failed to delete data.", "error");
      }
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" strokeWidth={1.8} />
          <span>Security & Privacy Panel</span>
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Full data transparency, encryption controls, Gemini AI privacy disclosures, and account revocation.
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 1. Plain, un-buried Gemini AI Disclosure */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Gemini AI Zero-Model-Training Guarantee</h3>
            <p className="text-[11px] text-muted">Strict zero-retention processing policy</p>
          </div>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">
          Email content is sent to the Gemini API exclusively for real-time summarization, classification, and event/task extraction. Your email content is <strong>never used to train machine learning models</strong> and is never retained or indexed by the AI model provider.
        </p>
      </div>

      {/* 2. Storage Transparency Per Account */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-elevated text-accent flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Storage Transparency by Connected Account</h3>
              <p className="text-[11px] text-muted">Exactly what is stored locally in SQLite vs encrypted at rest</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-surface-elevated text-muted border border-surface-borderSubtle flex items-center gap-1.5 font-mono">
            <Lock className="w-3 h-3 text-accent" strokeWidth={1.8} />
            <span>AES-256-GCM at Rest</span>
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-xl bg-surface-elevated border border-surface-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: acc.color || "#6E473B" }}
                >
                  {acc.initials || acc.email.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{acc.name || acc.email}</span>
                    {acc.isPrimary && (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-accent/15 text-accent">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-muted">{acc.email}</div>
                  <div className="flex items-center gap-3 text-[10px] text-muted mt-1 font-mono">
                    <span>OAuth Scopes: <code className="text-foreground/80">gmail.readonly</code>, <code className="text-foreground/80">calendar.events</code>, <code className="text-foreground/80">tasks</code></span>
                    <span>•</span>
                    <span className="text-accent font-semibold">Tokens Encrypted</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleRevokeAccount(acc.id, acc.email)}
                  disabled={revokingAccountId === acc.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  title="Revoke OAuth token server-side and delete all local rows for this account"
                >
                  <Unlink className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span>{revokingAccountId === acc.id ? "Revoking..." : "Revoke & Delete"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Configurable Raw Email Body Retention */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-elevated text-accent flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Email Body Retention & Auto-Purge</h3>
            <p className="text-[11px] text-muted">
              Auto-purge raw email bodies while permanently keeping executive summaries and tags
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-surface-elevated border border-surface-borderSubtle">
            <div className="text-[10px] font-bold text-muted uppercase">Total Messages Indexed</div>
            <div className="text-lg font-extrabold text-foreground mt-0.5">{stats?.totalEmails ?? 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-surface-borderSubtle">
            <div className="text-[10px] font-bold text-muted uppercase">Raw Full Bodies Stored</div>
            <div className="text-lg font-extrabold text-foreground mt-0.5">{stats?.rawBodiesStored ?? 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-surface-borderSubtle">
            <div className="text-[10px] font-bold text-muted uppercase">Purged Bodies (Summaries Kept)</div>
            <div className="text-lg font-extrabold text-emerald-500 mt-0.5">{stats?.purgedBodiesCount ?? 0}</div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-borderSubtle">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-muted font-medium">Auto-purge raw bodies older than:</span>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="bg-surface-elevated border border-surface-border text-foreground font-semibold px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days (Default)</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <button
            onClick={handlePurgeBodies}
            disabled={isPurging}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-elevated hover:bg-surface-highlight border border-surface-border text-foreground text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPurging ? "animate-spin" : ""}`} />
            <span>{isPurging ? "Purging..." : "Purge Stored Bodies Now"}</span>
          </button>
        </div>
      </div>

      {/* 4. Data Portability & Complete Deletion */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-elevated text-accent flex items-center justify-center flex-shrink-0">
            <Download className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Data Portability & Complete Erasure</h3>
            <p className="text-[11px] text-muted">Export your full dataset in JSON format or wipe all local database rows</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" strokeWidth={1.8} />
            <span>Export All Local Data (JSON)</span>
          </button>

          <button
            onClick={handleDeleteAll}
            disabled={isDeletingAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
            <span>{isDeletingAll ? "Deleting..." : "Permanently Delete All Records"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
