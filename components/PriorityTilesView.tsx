"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Clock,
  ExternalLink,
  Flame,
  LayoutGrid,
  Filter,
  User,
  Reply,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInHours } from "date-fns";
import { EmailData } from "./EmailDetailModal";

interface PriorityTilesViewProps {
  emails: EmailData[];
  onOpenEmail: (email: EmailData) => void;
  onScheduleEvent?: (email: EmailData) => void;
  onAddTask?: (email: EmailData) => void;
  onReply?: (email: EmailData) => void;
}

export type UrgencyLevel = "critical" | "high" | "medium" | "low";

interface EvaluatedTile {
  email: EmailData;
  urgency: UrgencyLevel;
  score: number;
  deadlineText: string | null;
  urgencyLabel: string;
  isPastDue: boolean;
}

export default function PriorityTilesView({
  emails,
  onOpenEmail,
  onScheduleEvent,
  onAddTask,
  onReply,
}: PriorityTilesViewProps) {
  const [filterMode, setFilterMode] = useState<"all" | "critical" | "high" | "standard">("all");
  const [sortBy, setSortBy] = useState<"urgency" | "date">("urgency");

  // Evaluate urgency and deadlines for every email
  const evaluatedTiles = useMemo<EvaluatedTile[]>(() => {
    return emails.map((email) => {
      let score = 0;
      let deadlineText: string | null = null;
      let isPastDue = false;

      const subjectLower = email.subject.toLowerCase();
      const summaryLower = email.summary.toLowerCase();
      const tags = email.tags || [];

      // Check for explicit "Urgent" tag or subject keywords
      const isUrgentTag = tags.some((t) => t.toLowerCase() === "urgent");
      const hasUrgentWords =
        subjectLower.includes("urgent") ||
        subjectLower.includes("asap") ||
        subjectLower.includes("immediately") ||
        subjectLower.includes("action required") ||
        subjectLower.includes("critical") ||
        summaryLower.includes("urgent");

      if (isUrgentTag || hasUrgentWords) {
        score += 50;
      }

      // Check task proposals for deadlines
      if (email.actionType === "task" && email.taskProposal?.dueDate) {
        score += 30;
        try {
          const due = new Date(email.taskProposal.dueDate);
          if (!isNaN(due.getTime())) {
            if (isPast(due) && !isToday(due)) {
              isPastDue = true;
              deadlineText = `Overdue (${format(due, "MMM d")})`;
              score += 40; // Overdue tasks get highest priority
            } else if (isToday(due)) {
              deadlineText = "Due Today";
              score += 45;
            } else if (isTomorrow(due)) {
              deadlineText = "Due Tomorrow";
              score += 35;
            } else {
              deadlineText = `Due ${format(due, "MMM d")}`;
              const diffHours = differenceInHours(due, new Date());
              if (diffHours < 72) score += 25;
            }
          }
        } catch {
          // ignore date parse errors
        }
      }

      // Check event proposals for upcoming dates
      if (email.actionType === "event" && email.eventProposal?.startTime) {
        score += 25;
        try {
          const eventStart = new Date(email.eventProposal.startTime);
          if (!isNaN(eventStart.getTime())) {
            if (isToday(eventStart)) {
              deadlineText = `Event Today at ${format(eventStart, "h:mm a")}`;
              score += 40;
            } else if (isTomorrow(eventStart)) {
              deadlineText = `Event Tomorrow at ${format(eventStart, "h:mm a")}`;
              score += 30;
            } else if (isPast(eventStart)) {
              deadlineText = `Event Past (${format(eventStart, "MMM d")})`;
            } else {
              deadlineText = `Event on ${format(eventStart, "MMM d, h:mm a")}`;
              const diffHours = differenceInHours(eventStart, new Date());
              if (diffHours < 96) score += 20;
            }
          }
        } catch {
          // ignore date parse errors
        }
      }

      // Tags weighting
      if (tags.includes("Work")) score += 10;
      if (tags.includes("Finance")) score += 15;
      if (tags.includes("College")) score += 20;
      if (tags.includes("Newsletters") || tags.includes("Promotions")) score -= 20;

      // Personalized Priority weight boost
      if (email.priority === "critical") score += 40;
      else if (email.priority === "high") score += 25;
      else if (email.priority === "medium") score += 10;
      else if (email.priority === "low") score -= 15;
      else if (email.priority === "ignore") score -= 40;

      // Classify into tiers
      let urgency: UrgencyLevel = "low";
      let urgencyLabel = "Standard";

      if (email.priority === "critical" || score >= 60) {
        urgency = "critical";
        urgencyLabel = isPastDue ? "Past Due" : "Critical Priority";
      } else if (email.priority === "high" || score >= 35) {
        urgency = "high";
        urgencyLabel = "High Urgency";
      } else if (score >= 15) {
        urgency = "medium";
        urgencyLabel = "Action Required";
      } else {
        urgency = "low";
        urgencyLabel = "Standard";
      }

      return {
        email,
        urgency,
        score,
        deadlineText,
        urgencyLabel,
        isPastDue,
      };
    });
  }, [emails]);

  // Filtering
  const filteredTiles = useMemo(() => {
    let list = [...evaluatedTiles];

    if (filterMode === "critical") {
      list = list.filter((t) => t.urgency === "critical");
    } else if (filterMode === "high") {
      list = list.filter((t) => t.urgency === "critical" || t.urgency === "high");
    } else if (filterMode === "standard") {
      list = list.filter((t) => t.urgency === "medium" || t.urgency === "low");
    }

    if (sortBy === "urgency") {
      list.sort((a, b) => b.score - a.score);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.email.receivedAt).getTime() - new Date(a.email.receivedAt).getTime()
      );
    }

    return list;
  }, [evaluatedTiles, filterMode, sortBy]);

  // Counts for top badge pills
  const counts = useMemo(() => {
    const critical = evaluatedTiles.filter((t) => t.urgency === "critical").length;
    const high = evaluatedTiles.filter((t) => t.urgency === "high").length;
    const standard = evaluatedTiles.filter((t) => t.urgency === "medium" || t.urgency === "low").length;
    return { critical, high, standard, total: evaluatedTiles.length };
  }, [evaluatedTiles]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-accent/15 text-accent">
              <LayoutGrid className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Urgency & Deadline Grid
            </h2>
          </div>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Dynamic tile matrix sized and color-coded by urgency level and upcoming deadlines.
          </p>
        </div>

        {/* Filter Pills & Sort Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-surface-elevated p-1 rounded-xl border border-surface-borderSubtle text-xs">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-surface-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setFilterMode("critical")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                filterMode === "critical"
                  ? "bg-red-500/20 text-red-500 font-bold shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Critical ({counts.critical})
            </button>
            <button
              onClick={() => setFilterMode("high")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                filterMode === "high"
                  ? "bg-amber-500/20 text-amber-500 font-bold shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              High ({counts.high})
            </button>
            <button
              onClick={() => setFilterMode("standard")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterMode === "standard"
                  ? "bg-surface-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Standard ({counts.standard})
            </button>
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface-elevated border border-surface-borderSubtle text-xs text-foreground font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="urgency">Sort by Urgency</option>
            <option value="date">Sort by Recent</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredTiles.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-card border border-surface-border text-center flex flex-col items-center">
          <Flame className="w-12 h-12 text-muted/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">No emails match this urgency filter</h3>
          <p className="text-xs text-muted mt-1 max-w-sm">
            Try switching back to "All" to view your complete email feed.
          </p>
        </div>
      ) : (
        /* Bento / Tile Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {filteredTiles.map(({ email, urgency, deadlineText, urgencyLabel }) => {
            const timeAgo = formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true });
            const connectedAcc = (email as any).connectedAccount;
            const accountEmail = (email as any).accountEmail || connectedAcc?.email;
            const initials =
              connectedAcc?.initials || (accountEmail ? accountEmail.slice(0, 2).toUpperCase() : "AC");
            const dotColor =
              connectedAcc?.color || (accountEmail?.includes("work") ? "#A78D78" : "#6E473B");

            // Define sizing & color schemes based on Urgency tier
            let containerStyles = "";
            let badgeStyle = "";
            let isLarge = false;

            if (urgency === "critical") {
              isLarge = true;
              // Larger bento span on desktop + flat tactile card with subtle red border
              containerStyles =
                "md:col-span-2 lg:col-span-2 row-span-2 bg-surface-card border-2 border-red-500/60 shadow-md ring-1 ring-red-500/10";
              badgeStyle = "bg-red-500 text-white font-mono font-bold";
            } else if (urgency === "high") {
              // Medium span on desktop with amber border
              containerStyles =
                "md:col-span-2 lg:col-span-1 bg-surface-card border border-amber-500/50 shadow-sm";
              badgeStyle = "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold border border-amber-500/30";
            } else if (urgency === "medium") {
              containerStyles =
                "col-span-1 bg-surface-card border border-surface-border hover:border-accent/60 shadow-sm";
              badgeStyle = "bg-accent/15 text-accent font-mono font-semibold";
            } else {
              // Low urgency: Compact neutral tile
              containerStyles =
                "col-span-1 bg-surface-card/90 border border-surface-borderSubtle hover:border-surface-border shadow-sm";
              badgeStyle = "bg-surface-elevated text-muted font-mono font-medium border border-surface-borderSubtle";
            }

            return (
              <div
                key={email.id}
                className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group relative ${containerStyles}`}
              >
                <div>
                  {/* Top Bar: Urgency Label, Deadline & Account Dot */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeStyle}`}>
                        {urgencyLabel}
                      </span>

                      {deadlineText && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-elevated text-foreground border border-surface-borderSubtle flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-accent" />
                          <span>{deadlineText}</span>
                        </span>
                      )}
                    </div>

                    {/* Account Indicator */}
                    <div
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-surface-elevated border border-surface-borderSubtle text-muted flex-shrink-0"
                      title={accountEmail || "Connected account"}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                      <span>{initials}</span>
                    </div>
                  </div>

                  {/* Header Summary (Subject) */}
                  <h3
                    onClick={() => onOpenEmail(email)}
                    className={`font-bold text-foreground group-hover:text-accent transition-colors cursor-pointer leading-snug break-words ${
                      isLarge ? "text-base sm:text-lg" : "text-sm sm:text-base"
                    }`}
                  >
                    {email.subject}
                  </h3>

                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
                    <span className="text-foreground/90 font-medium truncate max-w-[180px]">
                      {email.senderName || email.sender}
                    </span>
                    <span>•</span>
                    <span className="flex-shrink-0 text-[11px]">{timeAgo}</span>
                  </div>

                  {/* Executive AI Summary Box */}
                  <div
                    onClick={() => onOpenEmail(email)}
                    className={`mt-3 p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-2.5 ${
                      isLarge
                        ? "bg-surface-elevated/90 border-surface-border shadow-inner"
                        : "bg-surface-elevated/60 border-surface-borderSubtle"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    <p
                      className={`text-foreground/90 leading-relaxed ${
                        isLarge ? "text-xs sm:text-sm font-medium" : "text-xs font-normal"
                      }`}
                    >
                      {email.summary}
                    </p>
                  </div>

                  {/* Proposals preview if present */}
                  {email.actionType === "event" && email.eventProposal && (
                    <div className="mt-2.5 p-2 rounded-lg bg-surface-elevated border border-surface-borderSubtle text-[11px] text-foreground flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3 h-3 text-accent flex-shrink-0" />
                        <span className="truncate font-semibold">{email.eventProposal.title}</span>
                      </div>
                      {onScheduleEvent && (
                        <button
                          onClick={() => onScheduleEvent(email)}
                          className="px-2 py-0.5 rounded-md bg-accent text-white text-[10px] font-bold hover:opacity-90 flex-shrink-0"
                        >
                          Schedule
                        </button>
                      )}
                    </div>
                  )}

                  {email.actionType === "task" && email.taskProposal && (
                    <div className="mt-2.5 p-2 rounded-lg bg-surface-elevated border border-surface-borderSubtle text-[11px] text-foreground flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckSquare className="w-3 h-3 text-accent flex-shrink-0" />
                        <span className="truncate font-semibold">{email.taskProposal.title}</span>
                      </div>
                      {onAddTask && (
                        <button
                          onClick={() => onAddTask(email)}
                          className="px-2 py-0.5 rounded-md bg-accent text-white text-[10px] font-bold hover:opacity-90 flex-shrink-0"
                        >
                          Add Task
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Tile Controls: Open Email & Reply */}
                <div className="mt-4 pt-2.5 border-t border-surface-borderSubtle flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onOpenEmail(email)}
                    className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <span>Read Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {onReply && (
                      <button
                        onClick={() => onReply(email)}
                        className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-highlight border border-surface-borderSubtle text-foreground text-[11px] font-semibold transition-colors flex items-center gap-1"
                        title="Reply to this email"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
