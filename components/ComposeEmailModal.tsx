"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Sparkles,
  ChevronDown,
  Paperclip,
  Check,
  AlertCircle,
  Minimize2,
  Maximize2,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { ConnectedAccountData } from "./Sidebar";

export interface ComposeInitialData {
  to?: string;
  subject?: string;
  body?: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
  fromAccountId?: string;
}

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  accounts: ConnectedAccountData[];
  defaultAccountId?: string;
  initialData?: ComposeInitialData | null;
}

export default function ComposeEmailModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  defaultAccountId,
  initialData,
}: ComposeEmailModalProps) {
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [to, setTo] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState("");
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState<"executive" | "concise" | "friendly" | "formal">("executive");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or reset form fields when opening modal or receiving initialData
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setShowAiAssistant(false);
      setAiPrompt("");

      // Sender account selection: initialData -> defaultAccountId -> first account
      if (initialData?.fromAccountId) {
        setFromAccountId(initialData.fromAccountId);
      } else if (defaultAccountId && defaultAccountId !== "all") {
        setFromAccountId(defaultAccountId);
      } else if (accounts.length > 0) {
        const primary = accounts.find((a) => a.isPrimary) || accounts[0];
        setFromAccountId(primary.id);
      }

      setTo(initialData?.to || "");
      setSubject(initialData?.subject || "");
      setBody(initialData?.body || "");
      setCc("");
      setBcc("");
      setShowCc(false);
      setShowBcc(false);

      setTimeout(() => {
        if (!initialData?.to) {
          document.getElementById("compose-to-input")?.focus();
        } else {
          textareaRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialData, defaultAccountId, accounts]);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.id === fromAccountId) || accounts[0];

  const handleSend = async () => {
    setErrorMessage(null);

    if (!to.trim()) {
      setErrorMessage("Please specify at least one recipient email address.");
      document.getElementById("compose-to-input")?.focus();
      return;
    }

    if (!to.includes("@")) {
      setErrorMessage("Please enter a valid recipient email address (e.g. name@domain.com).");
      return;
    }

    if (!body.trim()) {
      setErrorMessage("Please enter a message body before sending.");
      textareaRef.current?.focus();
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: currentAccount?.id,
          to: to.trim(),
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim() || "(No Subject)",
          bodyText: body.trim(),
          inReplyTo: initialData?.inReplyTo,
          references: initialData?.references,
          threadId: initialData?.threadId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email.");
      }

      onSuccess(data.message || `Email sent successfully to ${to}!`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while sending.");
    } finally {
      setIsSending(false);
    }
  };

  const handleAiAction = async (action: "draft" | "polish") => {
    setIsAiLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/emails/compose-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          prompt: aiPrompt,
          currentSubject: subject,
          currentBody: body,
          tone: selectedTone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI assistant failed to generate text.");

      if (data.subject && (!subject || action === "draft")) {
        setSubject(data.subject);
      }
      if (data.body) {
        setBody(data.body);
      }
      setShowAiAssistant(false);
    } catch (err: any) {
      setErrorMessage(err.message || "AI generation failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter or Ctrl+Enter to send email
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClosePrompt = () => {
    if (body.trim() && !confirm("Discard this unsent email?")) {
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-surface-card border border-surface-border rounded-2xl shadow-2xl flex flex-col text-foreground overflow-hidden transition-all duration-200 ${
          isExpanded
            ? "w-full h-[95vh] max-w-5xl"
            : "w-full max-w-2xl max-h-[90vh] h-[680px]"
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Header Bar */}
        <div className="px-4 py-3 bg-surface-elevated border-b border-surface-border flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-bold text-foreground tracking-wide">
              {initialData?.inReplyTo ? "Reply Message" : "New Message"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface-highlight rounded-lg transition-colors"
              title={isExpanded ? "Collapse window" : "Expand window"}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClosePrompt}
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface-highlight rounded-lg transition-colors"
              title="Close compose"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sender & Recipient Metadata */}
        <div className="px-4 py-2 bg-surface-card border-b border-surface-borderSubtle space-y-2 text-xs">
          {/* From Account Row */}
          <div className="flex items-center gap-2">
            <label className="w-14 font-semibold text-muted text-right flex-shrink-0">
              From:
            </label>
            <div className="flex-1 min-w-0">
              {accounts.length > 1 ? (
                <div className="relative inline-block w-full">
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full bg-surface-elevated border border-surface-borderSubtle rounded-lg px-2.5 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer pr-8"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name || acc.email} &lt;{acc.email}&gt; {acc.isPrimary ? "(Primary)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-surface-borderSubtle text-foreground font-medium">
                  {currentAccount?.color && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: currentAccount.color }}
                    />
                  )}
                  <span>{currentAccount?.name || currentAccount?.email}</span>
                  <span className="text-muted text-[11px]">&lt;{currentAccount?.email}&gt;</span>
                </div>
              )}
            </div>
          </div>

          {/* To Recipient Row */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="compose-to-input"
              className="w-14 font-semibold text-muted text-right flex-shrink-0"
            >
              To:
            </label>
            <div className="flex-1 flex items-center gap-2">
              <input
                id="compose-to-input"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 bg-transparent border-none text-xs text-foreground placeholder:text-muted focus:outline-none py-1"
              />
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="hover:text-foreground hover:underline px-1"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="hover:text-foreground hover:underline px-1"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Optional CC Field */}
          {showCc && (
            <div className="flex items-center gap-2 animate-fade-in">
              <label className="w-14 font-semibold text-muted text-right flex-shrink-0">
                Cc:
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 bg-transparent border-none text-xs text-foreground placeholder:text-muted focus:outline-none py-1"
              />
              <button
                type="button"
                onClick={() => {
                  setCc("");
                  setShowCc(false);
                }}
                className="text-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Optional BCC Field */}
          {showBcc && (
            <div className="flex items-center gap-2 animate-fade-in">
              <label className="w-14 font-semibold text-muted text-right flex-shrink-0">
                Bcc:
              </label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="flex-1 bg-transparent border-none text-xs text-foreground placeholder:text-muted focus:outline-none py-1"
              />
              <button
                type="button"
                onClick={() => {
                  setBcc("");
                  setShowBcc(false);
                }}
                className="text-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Subject Row */}
          <div className="flex items-center gap-2 pt-1 border-t border-surface-borderSubtle">
            <label
              htmlFor="compose-subject-input"
              className="w-14 font-semibold text-muted text-right flex-shrink-0"
            >
              Subject:
            </label>
            <input
              id="compose-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Topic or executive subject line..."
              className="flex-1 bg-transparent border-none text-xs font-semibold text-foreground placeholder:text-muted focus:outline-none py-1"
            />
          </div>
        </div>

        {/* AI Assistant Drawer */}
        {showAiAssistant && (
          <div className="p-3 bg-surface-elevated border-b border-surface-border space-y-2.5 animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-accent font-bold uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive AI Copilot</span>
              </div>
              <button
                onClick={() => setShowAiAssistant(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Prompt Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="What would you like to say? e.g. 'Propose meeting on Friday at 3pm to review budget'"
                className="flex-1 bg-surface-card border border-surface-borderSubtle rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAiAction("draft");
                  }
                }}
              />
              <button
                onClick={() => handleAiAction("draft")}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-3 py-2 bg-accent text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>Generate Draft</span>
              </button>
            </div>

            {/* Tone Selector & Polish Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-muted text-[11px]">Tone:</span>
                {(["executive", "concise", "friendly", "formal"] as const).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedTone(tone)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                      selectedTone === tone
                        ? "bg-accent text-white shadow-sm"
                        : "bg-surface-card text-muted hover:text-foreground border border-surface-borderSubtle"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              {body.trim() && (
                <button
                  type="button"
                  onClick={() => handleAiAction("polish")}
                  disabled={isAiLoading}
                  className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Polish Current Draft ({selectedTone})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-2.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Email Body Textarea */}
        <div className="flex-1 p-4 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email here... Use Cmd+Enter to send."
            className="w-full h-full min-h-[220px] bg-transparent resize-none border-none text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none leading-relaxed font-sans"
          />
        </div>

        {/* Bottom Toolbar & Action Bar */}
        <div className="px-4 py-3 bg-surface-elevated border-t border-surface-border flex flex-wrap items-center justify-between gap-3">
          {/* Left tools: AI Copilot trigger & shortcut hint */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiAssistant(!showAiAssistant)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showAiAssistant
                  ? "bg-accent text-white border-accent shadow-sm"
                  : "bg-surface-card border-surface-borderSubtle text-accent hover:bg-surface-highlight"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>
            <span className="hidden sm:inline text-[11px] text-muted">
              Press <kbd className="px-1.5 py-0.5 bg-surface-card border border-surface-borderSubtle rounded text-[10px]">Cmd+Enter</kbd> to send
            </span>
          </div>

          {/* Right tools: Discard & Send Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClosePrompt}
              disabled={isSending}
              className="px-3.5 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-highlight rounded-xl transition-colors"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || isAiLoading}
              className="px-5 py-2 bg-accent text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
