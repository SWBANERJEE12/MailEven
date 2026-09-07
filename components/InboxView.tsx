"use client";

import React from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  ExternalLink,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Inbox,
  User,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmailData } from "./EmailDetailModal";

interface InboxViewProps {
  emails: EmailData[];
  selectedTag: string;
  setSelectedTag: (t: string) => void;
  statusFilter: "inbox" | "sent" | "archived";
  setStatusFilter: (s: "inbox" | "sent" | "archived") => void;
  onOpenEmail: (email: EmailData) => void;
  onArchiveToggle: (emailId: string, currentStatus: string) => Promise<void>;
  onScheduleEvent: (email: EmailData) => void;
  onAddTask: (email: EmailData) => void;
}

export default function InboxView({
  emails,
  selectedTag,
  statusFilter,
  setStatusFilter,
  onOpenEmail,
  onArchiveToggle,
  onScheduleEvent,
  onAddTask,
}: InboxViewProps) {
  return (
    <div className="space-y-4">
      {/* Top Controls: Active Filter Notice & Status Toggle */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-surface-borderSubtle">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Viewing:</span>
          <span className="font-bold text-foreground">
            {statusFilter === "inbox"
              ? "Inbox"
              : statusFilter === "sent"
              ? "Sent Messages"
              : "Archived Messages"}
          </span>
          {selectedTag !== "All" && (
            <span className="px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-foreground font-semibold">
              Tag: {selectedTag}
            </span>
          )}
          <span className="text-[11px] text-muted">({emails.length} total)</span>
        </div>

        {/* Status Toggle: Inbox vs Sent vs Archived */}
        <div className="flex items-center bg-surface-elevated p-1 rounded-xl border border-surface-borderSubtle">
          <button
            onClick={() => setStatusFilter("inbox")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === "inbox"
                ? "bg-surface-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setStatusFilter("sent")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === "sent"
                ? "bg-surface-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === "archived"
                ? "bg-surface-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Email List */}
      {emails.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-card border border-surface-border text-center flex flex-col items-center">
          <Inbox className="w-12 h-12 text-muted/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">No emails found</h3>
          <p className="text-xs text-muted mt-1 max-w-sm leading-relaxed">
            {selectedTag !== "All"
              ? `No messages match tag "${selectedTag}". Select "All" in the sidebar or click Sync.`
              : statusFilter === "archived"
              ? "Your archive is currently empty."
              : statusFilter === "sent"
              ? "No sent emails yet. Click 'New Email' to compose and send your first message!"
              : "No emails in your inbox right now."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {emails.map((email) => {
            const timeAgo = formatDistanceToNow(new Date(email.receivedAt), {
              addSuffix: true,
            });

            const connectedAcc = (email as any).connectedAccount;
            const accountEmail = (email as any).accountEmail || connectedAcc?.email;
            const initials = connectedAcc?.initials || (accountEmail ? accountEmail.slice(0, 2).toUpperCase() : "AC");
            const dotColor = connectedAcc?.color || (accountEmail?.includes("work") ? "#A78D78" : "#6E473B");

            return (
              <div
                key={email.id}
                className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-accent/50 transition-all group flex flex-col justify-between relative shadow-sm"
              >
                {/* Header Row: Badges, Account Indicator & Time */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Account Indicator Badge */}
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-foreground bg-surface-elevated border border-surface-borderSubtle"
                        title={`Received via ${accountEmail || "connected account"}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span>{initials}</span>
                        {accountEmail && (
                          <span className="hidden sm:inline text-muted font-normal text-[9px]">
                            • {accountEmail.split("@")[1]}
                          </span>
                        )}
                      </div>

                      {/* Category Pill */}
                      {email.category && (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                          {email.category}
                        </span>
                      )}

                      {/* Priority Pill with Explainability Tooltip */}
                      {email.priority && (
                        <span
                          title={email.personalizationReason || `Personalized priority: ${email.priority}`}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-help ${
                            email.priority === "critical"
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : email.priority === "high"
                              ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                              : email.priority === "medium"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            email.priority === "critical" ? "bg-red-500" :
                            email.priority === "high" ? "bg-orange-500" :
                            email.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                          }`} />
                          {email.priority}
                        </span>
                      )}

                      {/* Tags */}
                      {email.tags.filter((t) => t !== email.category).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-elevated text-muted hover:text-foreground border border-surface-borderSubtle"
                        >
                          {tag}
                        </span>
                      ))}

                      {/* Action Detection Pill */}
                      {email.isActionable && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/25 flex items-center gap-1">
                          {email.actionType === "event" ? (
                            <>
                              <Calendar className="w-2.5 h-2.5" /> Event Proposal
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-2.5 h-2.5" /> Action Item
                            </>
                          )}
                        </span>
                      )}

                      {email.status === "sent" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/25 flex items-center gap-1">
                          <Send className="w-2.5 h-2.5" /> Outgoing
                        </span>
                      )}

                      {email.briefingStatus === "actioned" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onOpenEmail(email)}
                      className="text-sm sm:text-base font-bold text-foreground group-hover:text-accent transition-colors cursor-pointer leading-snug"
                    >
                      {email.subject}
                    </h3>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                      {email.status === "sent" ? (
                        <>
                          <span className="text-foreground/90 font-medium">
                            <span className="text-accent font-bold">To:</span> {email.recipient}
                          </span>
                          <span>•</span>
                          <span className="text-muted">From: {email.senderName || email.sender}</span>
                          <span>•</span>
                          <span>{timeAgo}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-foreground/90 font-medium">
                            {email.senderName || email.sender}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{email.sender}</span>
                          <span>•</span>
                          <span>{timeAgo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Archive Toggle Button */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onArchiveToggle(email.id, email.status)}
                      className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
                      title={email.status === "archived" ? "Move to Inbox" : "Archive"}
                    >
                      {email.status === "archived" ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Executive Summary Card */}
                <div
                  onClick={() => onOpenEmail(email)}
                  className="mt-3 p-3 rounded-xl bg-surface-elevated/70 border border-surface-borderSubtle hover:border-accent/30 transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-foreground/90 font-normal leading-relaxed">
                    {email.summary}
                  </p>
                </div>

                {/* Bottom Row: View original & Action Triggers */}
                <div className="mt-3 pt-2.5 border-t border-surface-borderSubtle flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenEmail(email)}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                  >
                    <span>View original</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    {email.actionType === "event" && email.eventProposal && (
                      <button
                        onClick={() => onScheduleEvent(email)}
                        className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold transition-all shadow-sm hover:opacity-90 flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Event</span>
                      </button>
                    )}

                    {email.actionType === "task" && email.taskProposal && (
                      <button
                        onClick={() => onAddTask(email)}
                        className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold transition-all shadow-sm hover:opacity-90 flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Add Task</span>
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
