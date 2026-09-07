"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import MailEvenLogo from "./MailEvenLogo";
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Layers,
  Inbox,
  FileText,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function LandingPage() {
  const searchParams = useSearchParams();
  const oauthError = searchParams?.get("error");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [interactiveTab, setInteractiveTab] = useState<"inbox" | "briefing" | "summary">("inbox");

  const handleGoogleSignIn = () => {
    setIsLoadingGoogle(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleDemoSignIn = () => {
    setIsLoadingDemo(true);
    signIn("demo-login", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-accent selection:text-white relative overflow-hidden font-sans">
      {/* Floating Header */}
      <header data-od-id="landing-header" className="sticky top-0 z-50 backdrop-blur-xl bg-surface-card/85 border-b border-surface-border transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <MailEvenLogo size={36} />

          {/* Center Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted font-mono tracking-wide">
            <a href="#interactive-preview" className="hover:text-foreground transition-colors">
              Interface Preview
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              System Architecture
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Security Protocol
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDemoSignIn}
              disabled={isLoadingDemo}
              className="text-xs font-semibold text-foreground hover:text-accent px-4 py-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated transition-all shadow-sm flex items-center gap-1.5 active:translate-y-[1px]"
            >
              <Zap className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
              <span>{isLoadingDemo ? "Launching..." : "Dual-Account Demo"}</span>
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-white px-5 py-2.5 rounded-xl bg-accent hover:opacity-95 transition-all shadow-md active:translate-y-[1px]"
            >
              <span>Connect Google</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section data-od-id="hero-section" className="relative max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-16 text-center z-10 flex flex-col items-center">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono text-muted mb-8 shadow-sm">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-foreground font-semibold">MailEven Release</span>
          <span className="text-surface-border">/</span>
          <span className="text-accent font-semibold">Executive Intelligence</span>
        </div>

        {/* OAuth Configuration Alert if Triggered */}
        {oauthError && (
          <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left max-w-xl animate-fade-in">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <span>Google OAuth Setup Notice</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Google OAuth client ID is not yet configured in this environment. You can explore the full app with zero setup by clicking the <strong>"Explore Dual-Account Demo"</strong> button below!
            </p>
          </div>
        )}

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.12] max-w-4xl">
          Multi-account email, distilled into{" "}
          <span className="italic font-serif text-accent">
            calm executive action
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="mt-6 sm:mt-8 text-base sm:text-lg text-muted max-w-2xl leading-relaxed font-normal">
          MailEven unifies your work and personal Google accounts into a serene interleaved feed, computes urgency matrices, delivers actionable morning briefings, and resolves deep context intelligence without noise.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleDemoSignIn}
            disabled={isLoadingDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-accent text-white font-bold text-sm shadow-md hover:opacity-95 transition-all active:translate-y-[1px]"
          >
            <Zap className="w-4 h-4" strokeWidth={1.8} />
            <span>{isLoadingDemo ? "Opening Demo Environment..." : "Explore Dual-Account Demo"}</span>
          </button>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-surface-card hover:bg-surface-elevated text-foreground font-semibold text-sm border border-surface-border transition-all shadow-sm active:translate-y-[1px]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
            </svg>
            <span>{isLoadingGoogle ? "Connecting to Google..." : "Connect Google Account"}</span>
          </button>
        </div>

        {/* Reassurance Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted font-mono">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
            <span>AES-256 Encrypted At Rest</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
            <span>Zero Model Training</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
            <span>Dual-Stream Pipeline</span>
          </div>
        </div>
      </section>

      {/* Interactive Live Product Preview */}
      <section id="interactive-preview" data-od-id="preview-section" className="max-w-5xl mx-auto px-6 py-12 z-10 w-full">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent">
            Interface Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Three pillar views for executive focus
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center bg-surface-elevated p-1 rounded-xl border border-surface-border shadow-sm">
            <button
              onClick={() => setInteractiveTab("inbox")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                interactiveTab === "inbox"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>Interleaved Feed</span>
            </button>
            <button
              onClick={() => setInteractiveTab("briefing")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                interactiveTab === "briefing"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>Daily Action Briefing</span>
            </button>
            <button
              onClick={() => setInteractiveTab("summary")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                interactiveTab === "summary"
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>Executive Synthesis</span>
            </button>
          </div>
        </div>

        {/* Interactive Mockup Container */}
        <div className="rounded-2xl bg-surface-card border border-surface-border shadow-xl p-6 sm:p-8 relative overflow-hidden transition-all">
          {/* Top Mock Window Bar */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-borderSubtle">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-surface-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-surface-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-surface-border" />
              <span className="text-[11px] text-muted font-mono ml-2">app.maileven.ai</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>2 Accounts Interleaved</span>
            </div>
          </div>

          {/* View 1: Interleaved Feed Preview */}
          {interactiveTab === "inbox" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white bg-accent">
                      AC • Work
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-red-500 bg-red-500/10 border border-red-500/20">
                      Urgent
                    </span>
                    <span className="text-[11px] font-mono text-muted">Marcus Vance • 12 mins ago</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Investment Term Sheet Follow-up & Signing Call
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    Valuation cap agreed at $14M post-money. Requested confirmation call tomorrow at 11:30 AM EST.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>1-Tap Calendar</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-foreground bg-surface-card border border-surface-border">
                      AP • Personal
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-sky-500 bg-sky-500/10 border border-sky-500/20">
                      Travel
                    </span>
                    <span className="text-[11px] font-mono text-muted">Aero Hotel San Francisco • 1h ago</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Reservation Confirmation: King Suite (Check-in Friday)
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    Reservation #AERO-88219 confirmed for check-in on Friday at 3:00 PM PST.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1.5 rounded-lg bg-surface-card text-foreground border border-surface-border text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
                    <span>View Itinerary</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* View 2: Daily Action Briefing Preview */}
          {interactiveTab === "briefing" && (
            <div className="max-w-xl mx-auto p-6 rounded-xl bg-surface-elevated border border-surface-border space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-accent bg-accent/15 border border-accent/30">
                  Proposal 1 of 4
                </span>
                <span className="text-xs font-mono text-muted">Marcus Vance (Acme)</span>
              </div>
              <h4 className="text-base font-bold text-foreground font-display">
                Investment Term Sheet Confirmation Call
              </h4>
              <div className="p-3.5 rounded-lg bg-surface-card border border-surface-borderSubtle text-xs space-y-1">
                <div className="text-accent font-semibold flex items-center gap-1 font-mono text-[11px]">
                  <Sparkles className="w-3 h-3" strokeWidth={1.8} />
                  <span>Structured Extraction</span>
                </div>
                <p className="text-muted leading-relaxed">
                  Proposed: Tomorrow at 11:30 AM EST via Google Meet. Agenda: Finalize liquidation preference clause.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border text-center text-xs font-semibold text-muted">
                  Dismiss
                </div>
                <div className="p-2.5 rounded-lg bg-accent text-white text-center text-xs font-bold shadow-sm">
                  1-Tap Schedule
                </div>
              </div>
            </div>
          )}

          {/* View 3: AI Synthesis Preview */}
          {interactiveTab === "summary" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-xl bg-surface-elevated border border-surface-borderSubtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>Executive Synthesis</span>
                  </span>
                  <span className="text-xs font-mono text-muted">Last 7 Days (Dual Feed)</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  Across your connected accounts, 24 messages received this week. 8 items required executive action, including 2 term sheet milestones, 1 flight confirmation, and 1 security dependency upgrade.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="p-2 bg-surface-card rounded-lg border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-foreground font-mono">24</div>
                    <div className="text-[10px] text-muted font-mono">Total Mails</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded-lg border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-accent font-mono">8</div>
                    <div className="text-[10px] text-muted font-mono">Actionable</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded-lg border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-foreground font-mono">3</div>
                    <div className="text-[10px] text-muted font-mono">Calendar</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded-lg border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-foreground font-mono">5</div>
                    <div className="text-[10px] text-muted font-mono">Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Flow */}
      <section id="how-it-works" data-od-id="architecture-section" className="max-w-5xl mx-auto px-6 py-16 sm:py-24 z-10 w-full border-t border-surface-borderSubtle">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent">
            Workflow Architecture
          </h2>
          <p className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            How MailEven structures correspondence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-borderSubtle text-accent font-mono font-bold text-xs flex items-center justify-center">
              01
            </div>
            <h4 className="text-base font-bold text-foreground">Connect Accounts</h4>
            <p className="text-xs text-muted leading-relaxed">
              Sign in with your primary Google account, then add secondary work or personal credentials via OAuth with least-privilege scopes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-borderSubtle text-accent font-mono font-bold text-xs flex items-center justify-center">
              02
            </div>
            <h4 className="text-base font-bold text-foreground">Executive Distillation</h4>
            <p className="text-xs text-muted leading-relaxed">
              MailEven computes urgency, extracts meeting times, structures action items, and cross-references external topics via SerpApi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-borderSubtle text-accent font-mono font-bold text-xs flex items-center justify-center">
              03
            </div>
            <h4 className="text-base font-bold text-foreground">1-Tap Execution</h4>
            <p className="text-xs text-muted leading-relaxed">
              Dispatch events to Google Calendar and create checklist tasks directly from the briefing cards or message dossier.
            </p>
          </div>
        </div>
      </section>

      {/* Verified System Attributes Strip */}
      <section data-od-id="attributes-section" className="max-w-6xl mx-auto px-6 py-8 z-10 w-full">
        <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-surface-border grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-display font-bold text-foreground">2 Inboxes</div>
            <div className="text-xs font-mono text-muted">Single Interleaved Feed</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-display font-bold text-foreground">Zero</div>
            <div className="text-xs font-mono text-muted">Model Training Retained</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-display font-bold text-foreground">256-Bit</div>
            <div className="text-xs font-mono text-muted">AES-GCM Encryption</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-display font-bold text-accent">1-Tap</div>
            <div className="text-xs font-mono text-muted">Calendar & Task Sync</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section data-od-id="cta-section" className="max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center z-10 w-full">
        <div className="p-10 sm:p-14 rounded-2xl bg-surface-card border border-surface-border shadow-lg space-y-6 relative overflow-hidden">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
              A calmer, more decisive inbox awaits
            </h2>
            <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
              Explore the pre-configured dual-account demo environment or connect your Google Workspace to begin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleDemoSignIn}
              disabled={isLoadingDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-bold text-sm shadow-md hover:opacity-95 transition-all active:translate-y-[1px]"
            >
              <Zap className="w-4 h-4" strokeWidth={1.8} />
              <span>{isLoadingDemo ? "Opening Demo..." : "Start Instant Demo"}</span>
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-foreground font-semibold text-sm border border-surface-border transition-all active:translate-y-[1px]"
            >
              <span>Connect Google Account</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-surface-borderSubtle flex flex-col sm:flex-row items-center justify-between text-xs text-muted z-10 gap-4">
        <div className="flex items-center gap-3">
          <MailEvenLogo size={24} />
          <span>© 2026 MailEven. Executive AI Email Assistant.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-accent font-semibold">Executive Palette (Light & Dark)</span>
          <span>•</span>
          <span>Next.js • Tailwind • Auth.js • Gemini API</span>
        </div>
      </footer>
    </div>
  );
}
