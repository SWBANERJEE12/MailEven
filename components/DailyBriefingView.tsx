"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  ThumbsDown,
  ThumbsUp,
  ExternalLink,
  Clock,
  User,
  CheckCircle2,
  Inbox,
  ArrowRight,
  RotateCcw,
  Tag,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { EmailData } from "./EmailDetailModal";

const AVAILABLE_TAGS = [
  "All",
  "Urgent",
  "Work",
  "Personal",
  "Finance",
  "Travel",
];

interface DailyBriefingViewProps {
  items: EmailData[];
  onOpenOriginalEmail: (email: EmailData) => void;
  onActionComplete: () => void;
  onOpenActionModal: (email: EmailData, mode: "event" | "task") => void;
  onRefreshData: () => void;
}

export default function DailyBriefingView({
  items,
  onOpenOriginalEmail,
  onActionComplete,
  onOpenActionModal,
  onRefreshData,
}: DailyBriefingViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState("All");
  const [isDismissing, setIsDismissing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const filteredItems = items.filter((item) =>
    selectedTag === "All" ? true : item.tags.includes(selectedTag)
  );

  const currentEmail = filteredItems[currentIndex] || null;
  const totalCount = filteredItems.length;

  const handleDismiss = async () => {
    if (!currentEmail) return;
    setIsDismissing(true);
    try {
      await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: currentEmail.id, action: "dismiss" }),
      });
      setFeedbackToast(`Dismissed "${currentEmail.subject.slice(0, 30)}..." from briefing.`);
      setTimeout(() => setFeedbackToast(null), 3000);
      onActionComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDismissing(false);
    }
  };

  const handleInterested = () => {
    if (!currentEmail) return;
    // Determine action type: "event" or "task"
    const mode = currentEmail.actionType === "event" ? "event" : "task";
    onOpenActionModal(currentEmail, mode);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Tag Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Daily Action Briefing</span>
          </h2>
          <p className="text-xs text-muted-light mt-0.5">
            Focused, one-card-at-a-time review of today's actionable correspondence.
          </p>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {AVAILABLE_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedTag(t);
                setCurrentIndex(0);
              }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                selectedTag === t
                  ? "bg-accent text-white"
                  : "bg-surface-card hover:bg-surface-elevated text-muted-light border border-surface-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-3 bg-surface-elevated border border-accent/30 rounded-xl text-xs text-accent font-medium flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Progress Bar & Deck Counter */}
      {totalCount > 0 && currentEmail && (
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-2 font-medium">
            <span>
              Card {currentIndex + 1} of {totalCount}
            </span>
            <span>
              {Math.round(((currentIndex + 1) / totalCount) * 100)}% reviewed
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden border border-surface-border">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Actionable Card */}
      {!currentEmail || totalCount === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl bg-surface-card border border-surface-border text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
          <p className="text-xs text-muted-light mt-2 max-w-md leading-relaxed">
            You have reviewed all actionable emails in this briefing. Any scheduled calendar events or tasks have been synced.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onRefreshData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-border text-white text-xs font-semibold border border-surface-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-accent" />
              <span>Refresh Briefing</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden flex flex-col justify-between transition-all hover:border-accent/30 relative">
          {/* Accent top stripe */}
          <div className="h-1 w-full bg-accent" />

          <div className="p-6 sm:p-8 space-y-5">
            {/* Top Meta: Tags & Action Type */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {currentEmail.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      tag === "Urgent"
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : tag === "Work"
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                        : tag === "Finance"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : tag === "Travel"
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                        : "bg-surface-elevated text-muted-light border border-surface-border"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Detected Action Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold">
                {currentEmail.actionType === "event" ? (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Event-like (Calendar)</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Task-like (Google Tasks)</span>
                  </>
                )}
              </div>
            </div>

            {/* Sender and Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center text-sm font-bold text-accent">
                {currentEmail.senderName?.[0] || currentEmail.sender[0]}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {currentEmail.senderName || currentEmail.sender}
                </h4>
                <p className="text-xs text-muted truncate">{currentEmail.sender}</p>
              </div>
              <span className="text-[11px] text-muted flex-shrink-0">
                {formatDistanceToNow(new Date(currentEmail.receivedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Subject */}
            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {currentEmail.subject}
            </h3>

            {/* AI Executive Summary Box */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-accent/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Executive AI Summary</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed font-medium">
                {currentEmail.summary}
              </p>
            </div>

            {/* Proposed Action Preview Highlight */}
            {currentEmail.actionType === "event" && currentEmail.eventProposal && (
              <div className="p-3.5 rounded-xl bg-surface-base border border-surface-border text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-white font-semibold">Proposed: </span>
                    <span className="text-muted-light">
                      {format(new Date(currentEmail.eventProposal.startTime), "PPp")}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-accent font-bold">1 Tap Schedule</span>
              </div>
            )}

            {currentEmail.actionType === "task" && currentEmail.taskProposal && (
              <div className="p-3.5 rounded-xl bg-surface-base border border-surface-border text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckSquare className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-white font-semibold">Action Item: </span>
                    <span className="text-muted-light">
                      {currentEmail.taskProposal.title}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-accent font-bold">1 Tap Task</span>
              </div>
            )}

            {/* View Original Email Link */}
            <div className="pt-1">
              <button
                onClick={() => onOpenOriginalEmail(currentEmail)}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <span>View original full email</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Action Footer: The Two Core Buttons */}
          <div className="p-5 sm:p-6 bg-surface-base border-t border-surface-border grid grid-cols-2 gap-4">
            <button
              onClick={handleDismiss}
              disabled={isDismissing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-surface-card hover:bg-surface-elevated text-muted-light hover:text-white text-xs sm:text-sm font-semibold border border-surface-border transition-colors disabled:opacity-50"
            >
              <ThumbsDown className="w-4 h-4 text-muted" />
              <span>Not Interested</span>
            </button>

            <button
              onClick={handleInterested}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-bold shadow-lg shadow-accent/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Interested</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
