"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Calendar,
  CheckSquare,
  Clock,
  User,
  Mail,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";

export interface EmailData {
  id: string;
  sender: string;
  senderName?: string | null;
  recipient: string;
  subject: string;
  snippet?: string | null;
  bodyText?: string | null;
  bodyHtml?: string | null;
  receivedAt: string | Date;
  summary: string;
  isActionable: boolean;
  actionType: "event" | "task" | "none";
  eventProposal?: {
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    description?: string;
  } | null;
  taskProposal?: {
    title: string;
    dueDate?: string;
    notes?: string;
    priority?: "low" | "medium" | "high";
  } | null;
  tags: string[];
  briefingStatus: string;
  status: string;
  bodyPurgedAt?: string | Date | null;
}

interface EmailDetailModalProps {
  email: EmailData | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export default function EmailDetailModal({
  email,
  onClose,
  onActionComplete,
}: EmailDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"text" | "html">("text");
  const [isScheduling, setIsScheduling] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!email) return null;

  const handleCreateCalendarEvent = async () => {
    if (!email.eventProposal) return;
    setIsScheduling(true);
    try {
      const res = await fetch("/api/actions/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          title: email.eventProposal.title,
          startTime: email.eventProposal.startTime,
          endTime: email.eventProposal.endTime,
          location: email.eventProposal.location,
          description: email.eventProposal.description,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback("Event successfully scheduled on Google Calendar!");
        if (onActionComplete) onActionComplete();
      } else {
        alert(data.error || "Failed to schedule event.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCreateTask = async () => {
    if (!email.taskProposal) return;
    setIsScheduling(true);
    try {
      const res = await fetch("/api/actions/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          title: email.taskProposal.title,
          due: email.taskProposal.dueDate,
          notes: email.taskProposal.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback("Task added to Google Tasks!");
        if (onActionComplete) onActionComplete();
      } else {
        alert(data.error || "Failed to add task.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const formattedDate = format(new Date(email.receivedAt), "EEEE, MMMM d, yyyy 'at' h:mm a");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-foreground">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-border bg-surface-elevated flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {email.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-base text-muted border border-surface-borderSubtle"
                >
                  {tag}
                </span>
              ))}
              {email.isActionable && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo/10 text-indigo dark:bg-steelteal/15 dark:text-steelteal border border-indigo/20 dark:border-steelteal/30 flex items-center gap-1">
                  {email.actionType === "event" ? (
                    <>
                      <Calendar className="w-3 h-3" /> Event Detected
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3 h-3" /> Task Detected
                    </>
                  )}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug break-words">
              {email.subject}
            </h2>
            <div className="mt-2 text-xs text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 text-foreground/90 font-medium">
                <User className="w-3.5 h-3.5 text-indigo dark:text-steelteal" />
                {email.senderName || email.sender}
                <span className="text-muted font-normal"> &lt;{email.sender}&gt;</span>
              </span>
              <span className="flex items-center gap-1 text-muted">
                <Clock className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-highlight transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Executive AI Summary Box */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-surface-borderSubtle relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo dark:text-steelteal uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Executive AI Summary</span>
            </div>
            <p className="text-sm text-foreground/90 font-medium leading-relaxed">
              {email.summary}
            </p>
          </div>

          {/* Action Proposal Banner */}
          {actionFeedback ? (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          ) : email.actionType === "event" && email.eventProposal ? (
            <div className="p-4 rounded-xl bg-indigo/10 dark:bg-steelteal/15 border border-indigo/20 dark:border-steelteal/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-indigo dark:text-steelteal flex items-center gap-1.5 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Proposed Calendar Event</span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  {email.eventProposal.title}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {format(new Date(email.eventProposal.startTime), "PPp")} • {email.eventProposal.location || "Online"}
                </div>
              </div>
              <button
                onClick={handleCreateCalendarEvent}
                disabled={isScheduling}
                className="px-4 py-2 bg-indigo text-white dark:bg-steelteal text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 flex-shrink-0 flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isScheduling ? "Scheduling..." : "Add to Google Calendar"}</span>
              </button>
            </div>
          ) : email.actionType === "task" && email.taskProposal ? (
            <div className="p-4 rounded-xl bg-indigo/10 dark:bg-steelteal/15 border border-indigo/20 dark:border-steelteal/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-indigo dark:text-steelteal flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Proposed Task</span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  {email.taskProposal.title}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {email.taskProposal.dueDate
                    ? `Due: ${format(new Date(email.taskProposal.dueDate), "PP")}`
                    : "No specific due date"}
                </div>
              </div>
              <button
                onClick={handleCreateTask}
                disabled={isScheduling}
                className="px-4 py-2 bg-indigo text-white dark:bg-steelteal text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 flex-shrink-0 flex items-center justify-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isScheduling ? "Adding..." : "Add to Google Tasks"}</span>
              </button>
            </div>
          ) : null}

          {/* Original Source Email or Retention Purged Notice */}
          <div>
            <div className="flex items-center justify-between border-b border-surface-border pb-2 mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted" />
                <span>Original Source Message</span>
              </span>
              {email.bodyHtml && !email.bodyPurgedAt && (
                <div className="flex items-center gap-1 bg-surface-elevated p-0.5 rounded-lg border border-surface-borderSubtle">
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                      activeTab === "text"
                        ? "bg-surface-card text-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setActiveTab("html")}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                      activeTab === "html"
                        ? "bg-surface-card text-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    HTML
                  </button>
                </div>
              )}
            </div>

            {email.bodyPurgedAt ? (
              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-borderSubtle text-xs text-muted flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-indigo dark:text-steelteal flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Raw Body Purged</div>
                  <div className="mt-0.5 leading-relaxed">
                    This email's raw body content was automatically purged in compliance with your configured data retention policy. The AI executive summary, tags, and action items remain safely preserved.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-base border border-surface-borderSubtle text-xs sm:text-sm font-mono text-muted leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {activeTab === "html" && email.bodyHtml ? (
                  <div
                    className="prose prose-invert max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                  />
                ) : (
                  email.bodyText || email.snippet || "No body content available."
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-elevated border-t border-surface-border flex items-center justify-between">
          <span className="text-xs text-muted">
            Recipient: {email.recipient}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-card hover:bg-surface-highlight text-foreground text-xs font-semibold rounded-xl transition-colors border border-surface-borderSubtle"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
