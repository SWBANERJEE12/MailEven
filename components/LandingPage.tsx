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
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-accent/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-[800px] -left-48 w-[500px] h-[500px] bg-accent/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute top-[1600px] -right-48 w-[500px] h-[500px] bg-accent/10 blur-[180px] pointer-events-none rounded-full" />

      {/* Floating Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-card/75 border-b border-surface-borderSubtle transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <MailEvenLogo size={36} />

          {/* Center Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted">
            <a href="#interactive-preview" className="hover:text-foreground transition-colors">
              Live Preview
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Security & Privacy
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDemoSignIn}
              disabled={isLoadingDemo}
              className="text-xs font-semibold text-foreground hover:text-accent px-4 py-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated transition-all shadow-sm flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>{isLoadingDemo ? "Launching..." : "Dual-Account Demo"}</span>
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-white px-5 py-2.5 rounded-xl bg-accent hover:opacity-95 transition-all shadow-md active:scale-[0.98]"
            >
              <span>Connect Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-16 text-center z-10 flex flex-col items-center">
        {/* Floating Top Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-elevated/80 border border-surface-border text-xs font-medium text-muted mb-8 shadow-sm backdrop-blur-md animate-fade-in">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-foreground font-semibold">MailEven Phase 2</span>
          <span className="text-surface-border">•</span>
          <span className="text-accent font-bold">Executive Intelligence & Calm Design</span>
        </div>

        {/* OAuth Configuration Alert if Triggered */}
        {oauthError && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left max-w-xl animate-fade-in">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <span>Google OAuth Setup Notice</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Google OAuth client ID is not yet configured in this environment. You can explore the full app with zero setup by clicking the <strong>"Explore Dual-Account Demo"</strong> button below!
            </p>
          </div>
        )}

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12] max-w-4xl">
          Multi-account email, distilled into{" "}
          <span className="text-accent underline decoration-accent/40 decoration-wavy decoration-2 underline-offset-8">
            calm executive action
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="mt-6 sm:mt-8 text-base sm:text-xl text-muted max-w-2xl leading-relaxed font-normal">
          Stop drowning in notifications across split inboxes. MailEven unifies your work and personal accounts into a serene feed, delivers daily AI briefings, and turns correspondence into Google Calendar events and tasks in 1 tap.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleDemoSignIn}
            disabled={isLoadingDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-accent text-white font-bold text-sm sm:text-base shadow-xl hover:opacity-95 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{isLoadingDemo ? "Opening Demo Environment..." : "Explore Dual-Account Demo"}</span>
          </button>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-surface-card hover:bg-surface-elevated text-foreground font-semibold text-sm sm:text-base border border-surface-border transition-all shadow-md hover:scale-[1.01] active:scale-[0.98]"
          >
            {/* Google Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
            </svg>
            <span>{isLoadingGoogle ? "Connecting to Google..." : "Connect First Google Account"}</span>
          </button>
        </div>

        {/* Reassurance Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-accent" />
            <span>AES-256 Encrypted at Rest</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Zero Model Training Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Unified Multi-Account Stream</span>
          </div>
        </div>
      </section>

      {/* Interactive Live Product Preview */}
      <section id="interactive-preview" className="max-w-5xl mx-auto px-6 py-12 z-10 w-full">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent">
            Live Interface Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            Experience the three pillar views of MailEven
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center bg-surface-elevated p-1.5 rounded-2xl border border-surface-border shadow-sm">
            <button
              onClick={() => setInteractiveTab("inbox")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                interactiveTab === "inbox"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Interleaved Feed</span>
            </button>
            <button
              onClick={() => setInteractiveTab("briefing")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                interactiveTab === "briefing"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Action Briefing</span>
            </button>
            <button
              onClick={() => setInteractiveTab("summary")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                interactiveTab === "summary"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive AI Digest</span>
            </button>
          </div>
        </div>

        {/* Interactive Mockup Container */}
        <div className="rounded-3xl bg-surface-card border border-surface-border shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden transition-all">
          {/* Top Mock Window Bar */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-surface-borderSubtle">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="text-[11px] text-muted font-mono ml-2">app.maileven.ai</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Dual Accounts Active (Work + Personal)</span>
            </div>
          </div>

          {/* View 1: Interleaved Feed Preview */}
          {interactiveTab === "inbox" && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-accent">
                      AC • Work
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20">
                      Urgent
                    </span>
                    <span className="text-[11px] text-muted">Marcus Vance • 12 mins ago</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Urgent: Investment Term Sheet Follow-up & Signing Call
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    Executive Summary: Acme Ventures approved the revised valuation cap. Requests a 30-minute confirmation call tomorrow at 11:30 AM EST.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>1-Tap Calendar</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-foreground bg-surface-highlight border border-surface-border">
                      AP • Personal
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-sky-500 bg-sky-500/10 border border-sky-500/20">
                      Travel
                    </span>
                    <span className="text-[11px] text-muted">Aero Hotel San Francisco • 1 hour ago</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Reservation Confirmation: King Suite (Check-in Friday)
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    Executive Summary: Reservation #AERO-88219 confirmed for check-in on Friday at 3:00 PM PST.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-surface-card text-foreground border border-surface-border text-xs font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>View Itinerary</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* View 2: Daily Action Briefing Preview */}
          {interactiveTab === "briefing" && (
            <div className="max-w-xl mx-auto p-6 rounded-2xl bg-surface-elevated border border-surface-border shadow-lg space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-accent bg-accent/15 border border-accent/30">
                  Card 1 of 4 • Action Proposal
                </span>
                <span className="text-xs text-muted">Marcus Vance (Acme Ventures)</span>
              </div>
              <h4 className="text-base font-bold text-foreground">
                Investment Term Sheet Confirmation Call
              </h4>
              <div className="p-3.5 rounded-xl bg-surface-card border border-surface-borderSubtle text-xs space-y-1">
                <div className="text-accent font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Extracted Action</span>
                </div>
                <p className="text-muted leading-relaxed">
                  Proposed: Tomorrow at 11:30 AM EST via Google Meet. Agenda: Finalize liquidation preference clause.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border text-center text-xs font-semibold text-muted">
                  Not Interested (Dismiss)
                </div>
                <div className="p-2.5 rounded-xl bg-accent text-white text-center text-xs font-bold shadow-sm">
                  Interested (1-Tap Schedule)
                </div>
              </div>
            </div>
          )}

          {/* View 3: AI Weekly/Daily Digest Preview */}
          {interactiveTab === "summary" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-borderSubtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Executive AI Synthesis</span>
                  </span>
                  <span className="text-xs text-muted font-medium">Last 7 Days (Dual Feed)</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  Across your connected accounts, you received 24 messages this week. 8 items require immediate action, including 2 investor term sheet meetings, 1 flight confirmation, and 1 security dependency upgrade.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="p-2 bg-surface-card rounded-xl border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-foreground">24</div>
                    <div className="text-[10px] text-muted">Total Mails</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded-xl border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-accent">8</div>
                    <div className="text-[10px] text-muted">Actionable</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded-xl border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-foreground">3</div>
                    <div className="text-[10px] text-muted">Calendar Events</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded-xl border border-surface-borderSubtle">
                    <div className="text-sm font-bold text-foreground">5</div>
                    <div className="text-[10px] text-muted">Tasks Pending</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>



      {/* How It Works Flow */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16 sm:py-24 z-10 w-full border-t border-surface-borderSubtle">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent">
            Workflow Architecture
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How MailEven transforms your day in 3 steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-3 relative">
            <div className="w-9 h-9 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center shadow-md">
              1
            </div>
            <h4 className="text-base font-bold text-foreground">Connect Accounts</h4>
            <p className="text-xs text-muted leading-relaxed">
              Sign in with your first Google account, then add your work or secondary accounts via the sidebar with least-privilege OAuth scopes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-3 relative">
            <div className="w-9 h-9 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center shadow-md">
              2
            </div>
            <h4 className="text-base font-bold text-foreground">AI Distillation</h4>
            <p className="text-xs text-muted leading-relaxed">
              MailEven classifies urgency, extracts meeting times, synthesizes 1-2 sentence briefs, and filters out newsletters and promotional noise.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-3 relative">
            <div className="w-9 h-9 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center shadow-md">
              3
            </div>
            <h4 className="text-base font-bold text-foreground">1-Tap Execution</h4>
            <p className="text-xs text-muted leading-relaxed">
              Review your morning action briefing in 2 minutes. Insert proposed meetings into Google Calendar and confirm tasks with zero manual data entry.
            </p>
          </div>
        </div>
      </section>

      {/* Proof & Impact Metrics Strip */}
      <section className="max-w-6xl mx-auto px-6 py-12 z-10 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-elevated/70 border border-surface-border shadow-lg grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-accent">74%</div>
            <div className="text-xs text-muted font-medium">Time Saved on Triage</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground">0%</div>
            <div className="text-xs text-muted font-medium">Model Training on Data</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-accent">256-Bit</div>
            <div className="text-xs text-muted font-medium">AES-GCM Encryption</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground">1-Tap</div>
            <div className="text-xs text-muted font-medium">Calendar & Task Actions</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center z-10 w-full">
        <div className="p-10 sm:p-14 rounded-3xl bg-surface-card border-2 border-accent/40 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Ready for a calmer, smarter inbox?
            </h2>
            <p className="text-sm text-muted max-w-lg mx-auto">
              Test every feature in seconds using our pre-seeded dual-account demo, or link your Google account to get started.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleDemoSignIn}
              disabled={isLoadingDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-bold text-sm shadow-lg hover:opacity-95 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isLoadingDemo ? "Opening Demo..." : "Start Instant Demo"}</span>
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-foreground font-semibold text-sm border border-surface-border transition-all"
            >
              <span>Connect Google Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
