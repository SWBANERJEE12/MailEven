"use client";

import React, { useState, useEffect } from "react";
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
  Reply,
  Globe,
  Search,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  FileText,
  Compass,
  Bookmark,
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
  category?: string;
  priority?: "ignore" | "low" | "medium" | "high" | "critical";
  personalizationReason?: string | null;
  personalizationConfidence?: number | null;
  bodyPurgedAt?: string | Date | null;
}

interface ResearchSource {
  title: string;
  link: string;
  snippet: string;
  domain: string;
  date?: string;
}

interface ResearchResult {
  query: string;
  summary: string;
  knowledgeGraph?: {
    title: string;
    description: string;
    source?: { name: string; link: string };
  } | null;
  sources: ResearchSource[];
  relatedQueries: string[];
  isLive: boolean;
}

interface EmailDetailModalProps {
  email: EmailData | null;
  onClose: () => void;
  onActionComplete?: () => void;
  onReply?: (email: EmailData) => void;
}

export default function EmailDetailModal({
  email,
  onClose,
  onActionComplete,
  onReply,
}: EmailDetailModalProps) {
  const [modalTab, setModalTab] = useState<"details" | "research">("details");
  const [activeBodyTab, setActiveBodyTab] = useState<"text" | "html">("text");
  const [isScheduling, setIsScheduling] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Web Research & Topic Intelligence State
  const [researchData, setResearchData] = useState<ResearchResult | null>(null);
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [searchQueryInput, setSearchQueryInput] = useState("");
  const [researchError, setResearchError] = useState<string | null>(null);

  // Personalization Priority & Feedback State
  const [currentPriority, setCurrentPriority] = useState<string>("medium");
  const [currentReason, setCurrentReason] = useState<string | null>(null);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [priorityFeedbackMsg, setPriorityFeedbackMsg] = useState<string | null>(null);

  // Reset states when email changes
  useEffect(() => {
    if (email) {
      setModalTab("details");
      setResearchData(null);
      setResearchError(null);
      setSearchQueryInput("");
      setActionFeedback(null);
      setCurrentPriority(email.priority || "medium");
      setCurrentReason(email.personalizationReason || null);
      setPriorityFeedbackMsg(null);
    }
  }, [email?.id, email?.priority, email?.personalizationReason]);

  const handlePriorityCorrection = async (newPriority: string) => {
    if (!email || isUpdatingPriority || newPriority === currentPriority) return;
    setIsUpdatingPriority(true);
    setPriorityFeedbackMsg(null);

    try {
      const res = await fetch(`/api/emails/${email.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctedPriority: newPriority,
          reason: `Manually set to ${newPriority} priority.`,
        }),
      });

      if (!res.ok) throw new Error("Failed to record priority correction.");

      const data = await res.json();
      setCurrentPriority(newPriority);
      setCurrentReason(`Learned from your feedback: set to ${newPriority}.`);
      setPriorityFeedbackMsg(`AI updated! ${email.category || "Similar"} emails will now be prioritized as ${newPriority}.`);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      alert("Error updating priority: " + err.message);
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  if (!email) return null;

  const handleFetchResearch = async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQueryInput;
    setIsResearchLoading(true);
    setResearchError(null);

    try {
      const res = await fetch("/api/emails/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          query: q || undefined,
          subject: email.subject,
          sender: email.sender,
          bodyText: email.bodyText,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to retrieve research intelligence.");
      }

      const data: ResearchResult = await res.json();
      setResearchData(data);
      setSearchQueryInput(data.query);
    } catch (err: any) {
      setResearchError(err.message || "Failed to load topic context.");
    } finally {
      setIsResearchLoading(false);
    }
  };

  const handleSwitchToResearch = () => {
    setModalTab("research");
    if (!researchData && !isResearchLoading) {
      handleFetchResearch();
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      {/* Tactile Editorial Card Container */}
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-foreground">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-surface-border bg-surface-elevated flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row with tactile styling */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {email.category && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                  {email.category}
                </span>
              )}
              {email.tags.filter((t) => t !== email.category).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-base text-muted border border-surface-borderSubtle"
                >
                  {tag}
                </span>
              ))}
              {email.isActionable && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
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

              {/* Interactive Priority Selector */}
              <div className="flex items-center gap-1 ml-auto bg-surface-base border border-surface-borderSubtle rounded-lg p-0.5">
                <span className="text-[10px] font-mono text-muted uppercase px-1.5">Priority:</span>
                {(["low", "medium", "high", "critical"] as const).map((p) => {
                  const isSelected = currentPriority === p;
                  const colorMap: Record<string, string> = {
                    low: isSelected ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "text-muted hover:text-foreground",
                    medium: isSelected ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "text-muted hover:text-foreground",
                    high: isSelected ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "text-muted hover:text-foreground",
                    critical: isSelected ? "bg-red-500/20 text-red-400 border-red-500/40" : "text-muted hover:text-foreground",
                  };
                  return (
                    <button
                      key={p}
                      onClick={() => handlePriorityCorrection(p)}
                      disabled={isUpdatingPriority}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all capitalize ${
                        isSelected ? colorMap[p] : "border-transparent text-muted hover:bg-surface-elevated"
                      }`}
                      title={`Train AI: Mark as ${p} priority`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug break-words">
              {email.subject}
            </h2>

            <div className="mt-2 text-xs text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 text-foreground/90 font-medium">
                <User className="w-3.5 h-3.5 text-accent" />
                {email.senderName || email.sender}
                <span className="text-muted font-normal"> &lt;{email.sender}&gt;</span>
              </span>
              <span className="flex items-center gap-1 text-muted font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-highlight transition-colors flex-shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tactile Segmented Navigation Bar (Anti-AI Design) */}
        <div className="px-5 pt-3 bg-surface-elevated/70 border-b border-surface-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setModalTab("details")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                modalTab === "details"
                  ? "border-accent text-accent font-bold bg-surface-card shadow-sm"
                  : "border-transparent text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Message & Briefing</span>
            </button>

            <button
              onClick={handleSwitchToResearch}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                modalTab === "research"
                  ? "border-accent text-accent font-bold bg-surface-card shadow-sm"
                  : "border-transparent text-muted hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Context Intelligence</span>
              {researchData?.isLive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Google Search" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center text-[10px] font-mono text-muted uppercase tracking-wider">
            Dossier View
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {modalTab === "details" ? (
            /* TAB 1: MESSAGE DETAILS & AI SUMMARY */
            <>
              {/* Priority & Personalization Explainability Card */}
              {currentReason && (
                <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-accent/15 text-accent mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent">
                        Personalized Priority: {currentPriority}
                      </span>
                      {email.personalizationConfidence && (
                        <span className="text-[10px] font-mono text-muted bg-surface-base px-1.5 py-0.2 rounded border border-surface-borderSubtle">
                          {Math.round(email.personalizationConfidence * 100)}% match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                      {currentReason}
                    </p>
                    {priorityFeedbackMsg && (
                      <p className="text-xs text-emerald-500 font-medium mt-1">
                        ✓ {priorityFeedbackMsg}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Executive Summary Card (Tactile editorial note style) */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-accent uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Executive Summary</span>
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
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono font-bold text-accent flex items-center gap-1.5 uppercase tracking-wide">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Proposed Calendar Event</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground mt-1">
                      {email.eventProposal.title}
                    </div>
                    <div className="text-xs text-muted mt-0.5 font-mono">
                      {format(new Date(email.eventProposal.startTime), "PPp")} • {email.eventProposal.location || "Online"}
                    </div>
                  </div>
                  <button
                    onClick={handleCreateCalendarEvent}
                    disabled={isScheduling}
                    className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 flex-shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{isScheduling ? "Scheduling..." : "Add to Google Calendar"}</span>
                  </button>
                </div>
              ) : email.actionType === "task" && email.taskProposal ? (
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono font-bold text-accent flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Proposed Task Item</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground mt-1">
                      {email.taskProposal.title}
                    </div>
                    <div className="text-xs text-muted mt-0.5 font-mono">
                      {email.taskProposal.dueDate
                        ? `Due: ${format(new Date(email.taskProposal.dueDate), "PP")}`
                        : "No specific due date"}
                    </div>
                  </div>
                  <button
                    onClick={handleCreateTask}
                    disabled={isScheduling}
                    className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 flex-shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isScheduling ? "Adding..." : "Add to Google Tasks"}</span>
                  </button>
                </div>
              ) : null}

              {/* Original Source Email or Retention Purged Notice */}
              <div>
                <div className="flex items-center justify-between border-b border-surface-border pb-2 mb-3">
                  <span className="text-xs font-mono font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted" />
                    <span>Original Source Message</span>
                  </span>
                  {email.bodyHtml && !email.bodyPurgedAt && (
                    <div className="flex items-center gap-1 bg-surface-elevated p-0.5 rounded-lg border border-surface-borderSubtle">
                      <button
                        onClick={() => setActiveBodyTab("text")}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                          activeBodyTab === "text"
                            ? "bg-surface-card text-foreground shadow-sm"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Text
                      </button>
                      <button
                        onClick={() => setActiveBodyTab("html")}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                          activeBodyTab === "html"
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
                    <ShieldAlert className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Raw Body Purged</div>
                      <div className="mt-0.5 leading-relaxed">
                        This email's raw body content was automatically purged in compliance with your configured data retention policy.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface-base border border-surface-borderSubtle text-xs sm:text-sm font-mono text-muted leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {activeBodyTab === "html" && email.bodyHtml ? (
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
            </>
          ) : (
            /* TAB 2: CONTEXT INTELLIGENCE & REAL-TIME SEARCH (Anti-AI Crafted Dossier) */
            <div className="space-y-4">
              {/* Search & Topic Control Box */}
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-2 bg-surface-card px-3 py-2 rounded-lg border border-surface-borderSubtle">
                  <Search className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQueryInput}
                    onChange={(e) => setSearchQueryInput(e.target.value)}
                    placeholder="Search related topic context..."
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFetchResearch();
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleFetchResearch()}
                    disabled={isResearchLoading}
                    className="w-full sm:w-auto px-3.5 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isResearchLoading ? "animate-spin" : ""}`} />
                    <span>{isResearchLoading ? "Retrieving..." : "Research"}</span>
                  </button>

                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono border border-surface-borderSubtle bg-surface-card text-muted">
                    {researchData?.isLive ? "Live SerpApi Feed" : "Preview Feed"}
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {researchError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-500 font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{researchError}</span>
                </div>
              )}

              {/* Loading Skeleton */}
              {isResearchLoading && !researchData && (
                <div className="space-y-3 py-4 animate-pulse">
                  <div className="h-4 bg-surface-elevated rounded w-3/4" />
                  <div className="h-16 bg-surface-elevated rounded-xl" />
                  <div className="h-20 bg-surface-elevated rounded-xl" />
                </div>
              )}

              {/* Synthesized Intelligence Overview */}
              {researchData && (
                <>
                  <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border relative">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Background Context & Synthesis</span>
                      </span>
                      <span className="text-[10px] font-mono text-muted">
                        Topic: "{researchData.query}"
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                      {researchData.summary}
                    </p>
                  </div>

                  {/* Knowledge Graph Card (if returned by Google search) */}
                  {researchData.knowledgeGraph && (
                    <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border text-xs">
                      <div className="font-bold text-foreground text-sm mb-1">
                        {researchData.knowledgeGraph.title}
                      </div>
                      <p className="text-muted leading-relaxed text-xs">
                        {researchData.knowledgeGraph.description}
                      </p>
                      {researchData.knowledgeGraph.source && (
                        <a
                          href={researchData.knowledgeGraph.source.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-mono"
                        >
                          <span>Source: {researchData.knowledgeGraph.source.name}</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Sourced Web Citations */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs border-b border-surface-border pb-1.5">
                      <span className="font-mono font-bold uppercase tracking-wider text-muted text-[10px] flex items-center gap-1.5">
                        <Bookmark className="w-3 h-3" />
                        <span>Verified Sources & Citations ({researchData.sources.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {researchData.sources.map((source, idx) => (
                        <a
                          key={source.link + idx}
                          href={source.link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-surface-card border border-surface-border hover:border-accent/60 transition-all block group shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-elevated text-accent border border-surface-borderSubtle">
                              [{idx + 1}] {source.domain}
                            </span>
                            <ExternalLink className="w-3 h-3 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-accent transition-colors mt-1.5 line-clamp-1">
                            {source.title}
                          </div>
                          <p className="text-xs text-muted leading-relaxed mt-1 line-clamp-2">
                            {source.snippet}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Related Investigative Queries (Interactive Chips) */}
                  {researchData.relatedQueries.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] font-mono uppercase font-bold text-muted mb-2 tracking-wider">
                        Explore Related Inquiries
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {researchData.relatedQueries.map((rq) => (
                          <button
                            key={rq}
                            onClick={() => handleFetchResearch(rq)}
                            className="px-2.5 py-1 rounded-lg bg-surface-card hover:bg-surface-elevated border border-surface-border text-[11px] font-mono text-muted hover:text-foreground hover:border-accent transition-all flex items-center gap-1"
                            title={`Search: ${rq}`}
                          >
                            <Search className="w-2.5 h-2.5 text-accent" />
                            <span>{rq}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-elevated border-t border-surface-border flex items-center justify-between gap-3">
          <span className="text-xs font-mono text-muted truncate">
            Recipient: {email.recipient}
          </span>
          <div className="flex items-center gap-2">
            {onReply && (
              <button
                onClick={() => {
                  onClose();
                  onReply(email);
                }}
                className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 flex items-center gap-1.5"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-card hover:bg-surface-highlight text-foreground text-xs font-semibold rounded-xl transition-colors border border-surface-borderSubtle"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
