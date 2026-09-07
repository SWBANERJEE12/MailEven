"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  Inbox,
  Tag,
  Users,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmailData } from "./EmailDetailModal";

interface AiSummaryProps {
  selectedAccountId: string;
  onOpenEmail: (email: EmailData) => void;
  onScheduleEvent: (email: EmailData) => void;
  onAddTask: (email: EmailData) => void;
}

interface SummaryData {
  period: "today" | "week";
  overview: string;
  emailCount: number;
  actionableCount: number;
  eventCount: number;
  taskCount: number;
  highlights: {
    id: string;
    emailId: string;
    title: string;
    type: "urgent" | "event" | "task" | "finance" | "update";
    description: string;
    sender: string;
    senderName?: string | null;
    accountEmail?: string | null;
    time: string;
    actionType: "event" | "task" | "none";
    eventProposal?: any;
    taskProposal?: any;
  }[];
  categories: { name: string; count: number }[];
  topSenders: { name: string; count: number }[];
}

export default function AiSummaryView({
  selectedAccountId,
  onOpenEmail,
  onScheduleEvent,
  onAddTask,
}: AiSummaryProps) {
  const [period, setPeriod] = useState<"today" | "week">("today");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      if (selectedAccountId && selectedAccountId !== "all") {
        params.set("accountId", selectedAccountId);
      }

      const res = await fetch(`/api/ai-summary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error("Failed to load AI summary:", e);
    } finally {
      setIsLoading(false);
    }
  }, [period, selectedAccountId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleOpenEmailById = async (emailId: string) => {
    try {
      const res = await fetch(`/api/emails/${emailId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.email) onOpenEmail(data.email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionClick = async (emailId: string, actionType: "event" | "task") => {
    try {
      const res = await fetch(`/api/emails/${emailId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.email) {
          if (actionType === "event") onScheduleEvent(data.email);
          else onAddTask(data.email);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-surface-borderSubtle">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>AI Executive Summary</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Synthesized overview and critical action items across connected accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Day / Week Switcher */}
          <div className="flex items-center bg-surface-elevated p-1 rounded-xl border border-surface-borderSubtle shadow-sm">
            <button
              onClick={() => setPeriod("today")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === "today"
                  ? "bg-surface-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Today's Mail
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === "week"
                  ? "bg-surface-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              This Week's Mail
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchSummary}
            disabled={isLoading}
            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-surface-borderSubtle text-muted hover:text-foreground transition-colors disabled:opacity-50"
            title="Regenerate AI Summary"
          >
            <RotateCw className={`w-4 h-4 text-accent ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
          <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          <div className="text-sm font-bold text-foreground">
            Synthesizing {period === "today" ? "today's" : "this week's"} correspondence...
          </div>
          <p className="text-xs text-muted max-w-sm">
            MailEven is analyzing key topics, action proposals, and priorities with Gemini.
          </p>
        </div>
      ) : !summaryData ? (
        <div className="p-12 rounded-3xl bg-surface-card border border-surface-border text-center">
          <p className="text-sm text-muted">No summary data available.</p>
        </div>
      ) : (
        <>
          {/* Executive Overview Synthesis Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-surface-card border border-surface-border shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/15 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{period === "today" ? "Daily Executive Brief" : "Weekly Executive Brief"}</span>
              </div>
              <span className="text-[11px] text-muted font-medium">
                {period === "today" ? "Last 24 Hours" : "Last 7 Days"}
              </span>
            </div>

            <p className="text-sm sm:text-base text-foreground leading-relaxed font-normal">
              {summaryData.overview}
            </p>

            {/* Metrics Quick Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-card flex items-center justify-center text-accent">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {summaryData.emailCount}
                  </div>
                  <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
                    Total Emails
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-card flex items-center justify-center text-amber-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {summaryData.actionableCount}
                  </div>
                  <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
                    Actionable
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-card flex items-center justify-center text-accent">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {summaryData.eventCount}
                  </div>
                  <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
                    Events
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-card flex items-center justify-center text-emerald-500">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {summaryData.taskCount}
                  </div>
                  <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
                    Tasks
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Actionable Highlights */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-accent" />
                <span>Priority Correspondence & Action Items</span>
              </h3>
              <span className="text-xs text-muted">
                {summaryData.highlights.length} key highlight{summaryData.highlights.length === 1 ? "" : "s"}
              </span>
            </div>

            {summaryData.highlights.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-card border border-surface-border text-center text-xs text-muted">
                No priority items found for this timeframe.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {summaryData.highlights.map((item) => {
                  const isUrgent = item.type === "urgent";
                  const isEvent = item.actionType === "event";
                  const isTask = item.actionType === "task";

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-accent/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {isUrgent && (
                            <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-500 border border-red-500/30 text-[10px] font-bold">
                              Urgent
                            </span>
                          )}
                          {isEvent && (
                            <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/30 text-[10px] font-bold flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> Event
                            </span>
                          )}
                          {isTask && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <CheckSquare className="w-2.5 h-2.5" /> Task
                            </span>
                          )}
                          {item.accountEmail && (
                            <span className="text-[10px] text-muted bg-surface-elevated px-2 py-0.5 rounded-md border border-surface-borderSubtle">
                              {item.accountEmail}
                            </span>
                          )}
                          <span className="text-[11px] text-muted">
                            {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                          </span>
                        </div>

                        <h4
                          onClick={() => handleOpenEmailById(item.emailId)}
                          className="text-sm font-bold text-foreground group-hover:text-accent transition-colors cursor-pointer"
                        >
                          {item.title}
                        </h4>

                        <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        <div className="text-[11px] text-muted">
                          From: <span className="font-medium text-foreground">{item.senderName || item.sender}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isEvent && (
                          <button
                            onClick={() => handleActionClick(item.emailId, "event")}
                            className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule</span>
                          </button>
                        )}
                        {isTask && (
                          <button
                            onClick={() => handleActionClick(item.emailId, "task")}
                            className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Add Task</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEmailById(item.emailId)}
                          className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-highlight text-foreground text-xs font-semibold rounded-xl border border-surface-borderSubtle transition-colors flex items-center gap-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categories and Top Senders Dual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categories */}
            <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <Tag className="w-4 h-4 text-accent" />
                <span>Theme Distribution</span>
              </div>
              <div className="space-y-2">
                {summaryData.categories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/90 font-medium">{cat.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-borderSubtle text-[11px] font-bold text-accent">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Senders */}
            <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <Users className="w-4 h-4 text-accent" />
                <span>Top Correspondents</span>
              </div>
              <div className="space-y-2">
                {summaryData.topSenders.map((snd) => (
                  <div key={snd.name} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/90 font-medium truncate max-w-[200px]">
                      {snd.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-borderSubtle text-[11px] font-bold text-muted">
                      {snd.count} email{snd.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
