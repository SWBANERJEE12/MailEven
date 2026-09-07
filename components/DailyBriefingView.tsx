"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  ThumbsDown,
  ThumbsUp,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { EmailData } from "./EmailDetailModal";

interface DailyBriefingViewProps {
  items: EmailData[];
  onOpenOriginalEmail: (email: EmailData) => void;
  onActionComplete: () => void;
  onOpenActionModal: (email: EmailData, mode: "event" | "task") => void;
  onRefreshData: () => void;
  onNavigateToSummary?: () => void;
}

export default function DailyBriefingView({
  items,
  onOpenOriginalEmail,
  onActionComplete,
  onOpenActionModal,
  onRefreshData,
  onNavigateToSummary,
}: DailyBriefingViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const currentEmail = items[currentIndex] || null;
  const totalCount = items.length;

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
    const mode = currentEmail.actionType === "event" ? "event" : "task";
    onOpenActionModal(currentEmail, mode);
  };

  const connectedAcc = (currentEmail as any)?.connectedAccount;
  const accountEmail = (currentEmail as any)?.accountEmail || connectedAcc?.email;
  const initials = connectedAcc?.initials || (accountEmail ? accountEmail.slice(0, 2).toUpperCase() : "AC");
  const dotColor = connectedAcc?.color || (accountEmail?.includes("work") ? "#A78D78" : "#6E473B");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Daily Action Briefing</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            One-card-at-a-time review of today's actionable correspondence.
          </p>
        </div>

        {onNavigateToSummary && (
          <button
            onClick={onNavigateToSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-surface-borderSubtle text-xs font-semibold text-accent transition-colors shadow-sm self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Full AI Summary</span>
          </button>
        )}
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-3 bg-surface-elevated border border-accent/30 rounded-xl text-xs text-accent font-medium flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
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
          <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden border border-surface-borderSubtle">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Actionable Card */}
      {!currentEmail || totalCount === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl bg-surface-card border border-surface-border text-center flex flex-col items-center shadow-lg relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-surface-borderSubtle flex items-center justify-center text-accent mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">All Caught Up!</h3>
          <p className="text-xs text-muted mt-2 max-w-md leading-relaxed">
            You have reviewed all actionable emails in this briefing. Scheduled calendar events and tasks are safely stored.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onRefreshData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-foreground text-xs font-semibold border border-surface-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-accent" />
              <span>Refresh Briefing</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface-card border border-surface-border shadow-lg overflow-hidden flex flex-col justify-between transition-all hover:border-accent/40 relative">
          {/* Subtle top accent border */}
          <div className="h-1.5 w-full bg-accent" />

          <div className="p-6 sm:p-8 space-y-5">
            {/* Top Meta: Account Indicator, Tags & Action Type */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Account Indicator */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold text-foreground bg-surface-elevated border border-surface-borderSubtle"
                  title={`Account: ${accountEmail || "connected"}`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span>{initials}</span>
                  {accountEmail && (
                    <span className="text-muted font-normal text-[9px]">
                      • {accountEmail.split("@")[0]}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {currentEmail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-elevated text-muted border border-surface-borderSubtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Detected Action Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent/10 text-accent border border-accent/25 text-xs font-bold">
                {currentEmail.actionType === "event" ? (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Event Proposal</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Action Item</span>
                  </>
                )}
              </div>
            </div>

            {/* Sender and Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-borderSubtle flex items-center justify-center text-sm font-bold text-accent">
                {currentEmail.senderName?.[0] || currentEmail.sender[0]}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-foreground truncate">
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
            <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
              {currentEmail.subject}
            </h3>

            {/* AI Executive Summary Box */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-surface-borderSubtle space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Executive AI Summary</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed font-normal">
                {currentEmail.summary}
              </p>
            </div>

            {/* Proposed Action Preview Highlight */}
            {currentEmail.actionType === "event" && currentEmail.eventProposal && (
              <div className="p-3.5 rounded-xl bg-surface-base border border-surface-borderSubtle text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-foreground font-semibold">Proposed: </span>
                    <span className="text-muted">
                      {format(new Date(currentEmail.eventProposal.startTime), "PPp")}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-accent font-bold">1 Tap Calendar</span>
              </div>
            )}

            {currentEmail.actionType === "task" && currentEmail.taskProposal && (
              <div className="p-3.5 rounded-xl bg-surface-base border border-surface-borderSubtle text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckSquare className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-foreground font-semibold">Action Item: </span>
                    <span className="text-muted">
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
                <span>View original source email</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Action Footer: The Two Core Buttons */}
          <div className="p-5 sm:p-6 bg-surface-elevated border-t border-surface-border grid grid-cols-2 gap-4">
            <button
              onClick={handleDismiss}
              disabled={isDismissing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-card hover:bg-surface-highlight text-muted hover:text-foreground text-xs sm:text-sm font-semibold border border-surface-borderSubtle transition-colors disabled:opacity-50"
            >
              <ThumbsDown className="w-4 h-4 text-muted" />
              <span>Not Interested</span>
            </button>

            <button
              onClick={handleInterested}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-white text-xs sm:text-sm font-bold shadow-sm transition-all hover:opacity-95 active:scale-[0.99]"
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
