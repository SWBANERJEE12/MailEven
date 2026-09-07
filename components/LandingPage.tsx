"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import MailEvenLogo from "./MailEvenLogo";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  BellRing,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
} from "lucide-react";

export default function LandingPage() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoadingGoogle(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleDemoSignIn = () => {
    setIsLoadingDemo(true);
    signIn("demo-login", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col justify-between selection:bg-accent selection:text-white relative overflow-hidden">
      {/* Ambient background glows in #FE4401 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-accent/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top bar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <MailEvenLogo size={42} />
        <div className="flex items-center gap-3">
          <button
            onClick={handleDemoSignIn}
            disabled={isLoadingDemo}
            className="text-xs font-semibold text-muted-light hover:text-white px-3.5 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated transition-colors"
          >
            {isLoadingDemo ? "Loading Demo..." : "Explore Demo Mode"}
          </button>
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
            className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover transition-colors shadow-lg shadow-accent/25"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center z-10 flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs font-medium text-muted-light mb-8">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-white font-semibold">MailEven AI Client</span>
          <span className="text-surface-border">|</span>
          <span className="text-muted-light">Powered by Gemini & Google APIs</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-3xl">
          Turn your inbox into <span className="text-accent underline decoration-accent/30 decoration-wavy">executive actions</span> in one tap.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-muted-light max-w-2xl leading-relaxed">
          MailEven summarizes your Gmail messages with Gemini AI, curates a focused Daily Action Briefing, and schedules Google Calendar blocks or tasks with a single click.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-xl shadow-accent/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Google G icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
            </svg>
            <span>{isLoadingGoogle ? "Connecting to Google..." : "Sign in with Google"}</span>
          </button>

          <button
            onClick={handleDemoSignIn}
            disabled={isLoadingDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-card hover:bg-surface-elevated text-white font-semibold text-sm border border-surface-border hover:border-accent/40 transition-all"
          >
            <Zap className="w-4 h-4 text-accent" />
            <span>{isLoadingDemo ? "Opening Demo..." : "Explore Live Demo"}</span>
          </button>
        </div>

        {/* Permissions note */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Requests Gmail (read-only), Calendar, and Tasks in one consent flow.</span>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 text-left w-full">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-accent/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base">Executive AI Summaries</h3>
            <p className="mt-2 text-xs text-muted-light leading-relaxed">
              Every incoming email is condensed into 1–2 crisp sentences with auto-assigned tags (Work, Finance, Travel, Urgent) and instant link to source.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-accent/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base">Daily Action Briefing</h3>
            <p className="mt-2 text-xs text-muted-light leading-relaxed">
              Review actionable emails one-at-a-time. Dismiss with "Not Interested", or tap "Interested" to review pre-filled event or task details.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-accent/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-base">Ambient Push Briefings</h3>
            <p className="mt-2 text-xs text-muted-light leading-relaxed">
              Real-time Web Push notifications and an in-app fallback bell deliver synthesized summaries the moment new correspondence arrives.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted z-10 gap-2">
        <div className="flex items-center gap-2">
          <span>MailEven © 2026</span>
          <span>•</span>
          <span>Next.js • Tailwind • Auth.js • Gemini API • SQLite</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-accent font-medium">Primary Accent #FE4401</span>
        </div>
      </footer>
    </div>
  );
}
