"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  ExternalLink,
  Archive,
  ArchiveRestore,
  Filter,
  Clock,
  User,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmailData } from "./EmailDetailModal";

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

interface InboxViewProps {
  emails: EmailData[];
  selectedTag: string;
  setSelectedTag: (t: string) => void;
  statusFilter: "inbox" | "archived";
  setStatusFilter: (s: "inbox" | "archived") => void;
  onOpenEmail: (email: EmailData) => void;
  onArchiveToggle: (emailId: string, currentStatus: string) => Promise<void>;
  onScheduleEvent: (email: EmailData) => void;
  onAddTask: (email: EmailData) => void;
}

export default function InboxView({
  emails,
  selectedTag,
  setSelectedTag,
  statusFilter,
  setStatusFilter,
  onOpenEmail,
  onArchiveToggle,
  onScheduleEvent,
  onAddTask,
}: InboxViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {AVAILABLE_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-accent text-white shadow-sm shadow-accent/25"
                    : "bg-surface-card hover:bg-surface-elevated text-muted-light hover:text-white border border-surface-border"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Status Filter (Inbox vs Archived) */}
        <div className="flex items-center bg-surface-card p-1 rounded-xl border border-surface-border self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("inbox")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === "inbox"
                ? "bg-surface-elevated text-white shadow-sm"
                : "text-muted hover:text-white"
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === "archived"
                ? "bg-surface-elevated text-white shadow-sm"
                : "text-muted hover:text-white"
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
          <h3 className="text-base font-bold text-white">No emails found</h3>
          <p className="text-xs text-muted-light mt-1 max-w-sm">
            {selectedTag !== "All"
              ? `No messages tagged "${selectedTag}". Try switching tags or syncing mail.`
              : statusFilter === "archived"
              ? "Your archive is currently empty."
              : "No emails in your inbox right now."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {emails.map((email) => {
            const timeAgo = formatDistanceToNow(new Date(email.receivedAt), {
              addSuffix: true,
            });

            return (
              <div
                key={email.id}
                className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-accent/40 transition-all group flex flex-col justify-between relative shadow-lg shadow-black/40"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {email.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                      {email.isActionable && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
                          {email.actionType === "event" ? (
                            <>
                              <Calendar className="w-2.5 h-2.5" /> Event Detected
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-2.5 h-2.5" /> Task Detected
                            </>
                          )}
                        </span>
                      )}

                      {email.briefingStatus === "actioned" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Action Scheduled
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onOpenEmail(email)}
                      className="text-base font-bold text-white group-hover:text-accent transition-colors cursor-pointer leading-snug"
                    >
                      {email.subject}
                    </h3>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                      <span className="text-white/90 font-medium">
                        {email.senderName || email.sender}
                      </span>
                      <span>•</span>
                      <span>{email.sender}</span>
                      <span>•</span>
                      <span>{timeAgo}</span>
                    </div>
                  </div>

                  {/* Top Right Quick Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onArchiveToggle(email.id, email.status)}
                      className="p-2 text-muted hover:text-white hover:bg-surface-elevated rounded-xl transition-colors"
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
                  className="mt-3.5 p-3.5 rounded-xl bg-surface-elevated/80 border border-surface-borderSubtle hover:border-accent/30 transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-foreground/90 font-normal leading-relaxed">
                    {email.summary}
                  </p>
                </div>

                {/* Bottom Row: View Original & Detected Action Trigger */}
                <div className="mt-4 pt-3 border-t border-surface-borderSubtle flex flex-wrap items-center justify-between gap-2">
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
                        className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-colors shadow-sm shadow-accent/20 flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Event</span>
                      </button>
                    )}

                    {email.actionType === "task" && email.taskProposal && (
                      <button
                        onClick={() => onAddTask(email)}
                        className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-colors shadow-sm shadow-accent/20 flex items-center gap-1.5"
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
