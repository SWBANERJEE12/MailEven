"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import LandingPage from "@/components/LandingPage";
import Sidebar, { ConnectedAccountData } from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import InboxView from "@/components/InboxView";
import DailyBriefingView from "@/components/DailyBriefingView";
import PriorityTilesView from "@/components/PriorityTilesView";
import AiSummaryView from "@/components/AiSummaryView";
import CalendarTasksView from "@/components/CalendarTasksView";
import PrivacyPanel from "@/components/PrivacyPanel";
import SettingsView from "@/components/SettingsView";
import EmailDetailModal, { EmailData } from "@/components/EmailDetailModal";
import ActionModal from "@/components/ActionModal";
import ComposeEmailModal, { ComposeInitialData } from "@/components/ComposeEmailModal";
import CookieNotice from "@/components/CookieNotice";
import MailEvenLogo from "@/components/MailEvenLogo";
import { getPreferencesClient } from "@/lib/cookies";
import { CheckCircle2, ExternalLink } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<
    "inbox" | "briefing" | "priority-grid" | "summary" | "calendar-tasks" | "privacy" | "settings"
  >("inbox");

  const [accounts, setAccounts] = useState<ConnectedAccountData[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"inbox" | "sent" | "archived">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [emails, setEmails] = useState<EmailData[]>([]);
  const [briefingItems, setBriefingItems] = useState<EmailData[]>([]);
  const [selectedEmailModal, setSelectedEmailModal] = useState<EmailData | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; link?: string } | null>(null);

  // Compose Email Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState<ComposeInitialData | null>(null);

  // Action Modal State
  const [actionModalState, setActionModalState] = useState<{
    email: EmailData | null;
    mode: "event" | "task" | null;
    isOpen: boolean;
  }>({
    email: null,
    mode: null,
    isOpen: false,
  });

  // Initialize preferences from cookie
  useEffect(() => {
    const prefs = getPreferencesClient();
    const activeAcc = prefs.accountFilter || prefs.lastActiveAccount;
    if (activeAcc) setSelectedAccountId(activeAcc);
    if (prefs.lastTagFilter) setSelectedTag(prefs.lastTagFilter);
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error("Failed to fetch accounts:", e);
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTag && selectedTag !== "All") params.set("tag", selectedTag);
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (selectedAccountId && selectedAccountId !== "all") {
        params.set("accountId", selectedAccountId);
      }

      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (e) {
      console.error("Failed to fetch emails:", e);
    }
  }, [selectedTag, searchQuery, statusFilter, selectedAccountId]);

  const fetchBriefing = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedAccountId && selectedAccountId !== "all") {
        params.set("accountId", selectedAccountId);
      }

      const res = await fetch(`/api/briefing?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBriefingItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch briefing items:", e);
    }
  }, [selectedAccountId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchAccounts(), fetchEmails(), fetchBriefing()]);
  }, [fetchAccounts, fetchEmails, fetchBriefing]);

  useEffect(() => {
    if (session?.user) {
      refreshAll();
    }
  }, [session, refreshAll]);

  // Handle URL query params for opening specific email or account alerts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const emailId = urlParams.get("emailId");
      if (emailId) {
        fetch(`/api/emails/${emailId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.email) setSelectedEmailModal(data.email);
          })
          .catch(console.error);
      }
      const accountConnected = urlParams.get("accountConnected");
      if (accountConnected) {
        showToast(`Successfully linked Google account: ${accountConnected}`);
        fetchAccounts();
      }
      const accountError = urlParams.get("accountError");
      if (accountError) {
        showToast(`Account connection notice: ${accountError}`);
      }
    }
  }, [fetchAccounts]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const data = await res.json();
      await refreshAll();
      showToast(data.message || "Sync complete!");
    } catch (e) {
      console.error(e);
      showToast("Sync encountered an error.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleArchiveToggle = async (emailId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "archived" ? "inbox" : "archived";
    try {
      await fetch("/api/emails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, status: nextStatus }),
      });
      await fetchEmails();
      showToast(nextStatus === "archived" ? "Email archived" : "Moved back to Inbox");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAccount = async () => {
    const isDemo = (session?.user as any)?.isDemo ?? false;

    if (isDemo) {
      const choice = confirm(
        "Link Account:\n\n• Click OK to connect a REAL Google account via OAuth consent.\n• Click CANCEL to simulate a quick Demo Account."
      );
      if (choice) {
        window.location.href = "/api/accounts/google/connect";
        return;
      }

      const emailPrompt = prompt(
        "Enter a demo email address to connect as an additional account:",
        `alex.investor@fund-${Date.now().toString().slice(-4)}.co`
      );
      if (!emailPrompt) return;

      try {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailPrompt.trim(),
            name: emailPrompt.split("@")[0].replace(".", " "),
            color: "#A78D78",
          }),
        });
        if (res.ok) {
          showToast(`Connected account ${emailPrompt}!`);
          await refreshAll();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // In production/live mode, trigger dedicated Google OAuth linking flow
      window.location.href = "/api/accounts/google/connect";
    }
  };

  const showToast = (text: string, link?: string) => {
    setToastMessage({ text, link });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleOpenActionModal = (email: EmailData, mode: "event" | "task") => {
    setActionModalState({
      email,
      mode,
      isOpen: true,
    });
  };

  const handleOpenCompose = (data?: ComposeInitialData) => {
    setComposeInitialData(data || null);
    setIsComposeOpen(true);
  };

  const handleReplyEmail = (email: EmailData) => {
    const cleanSubject = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
    const formattedDate = new Date(email.receivedAt).toLocaleString();
    const quotedBody = `\n\n\n--- On ${formattedDate}, ${email.senderName || email.sender} wrote ---\n> ${
      (email.bodyText || email.snippet || "").split("\n").join("\n> ")
    }`;

    handleOpenCompose({
      to: email.sender,
      subject: cleanSubject,
      body: quotedBody,
      inReplyTo: (email as any).googleMessageId || undefined,
      threadId: (email as any).threadId || undefined,
      fromAccountId: (email as any).connectedAccountId || undefined,
    });
  };

  const handleSelectEmailById = async (id: string) => {
    try {
      const res = await fetch(`/api/emails/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.email) setSelectedEmailModal(data.email);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center text-center p-4">
        <MailEvenLogo size={48} />
        <div className="mt-4 text-xs text-muted font-medium animate-pulse">
          Initializing MailEven executive assistant...
        </div>
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex selection:bg-indigo selection:text-foggy">
      {/* Desktop & Mobile Slide-Over Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        briefingCount={briefingItems.length}
        inboxCount={emails.length}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onAddAccount={handleAddAccount}
        onCompose={() => handleOpenCompose()}
      />

      {/* Main Content Area (Offset by Sidebar on Desktop) */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSync={handleSync}
          isSyncing={isSyncing}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectEmail={handleSelectEmailById}
          onRefreshData={refreshAll}
          onCompose={() => handleOpenCompose()}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 bg-surface-card border border-indigo/40 dark:border-steelteal/40 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-xs font-semibold text-foreground max-w-md backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-indigo dark:text-steelteal flex-shrink-0" />
            <div className="flex-1">
              <span>{toastMessage.text}</span>
              {toastMessage.link && (
                <a
                  href={toastMessage.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-indigo dark:text-steelteal underline mt-0.5 flex items-center gap-1 font-bold"
                >
                  <span>Open in Google</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "inbox" && (
            <InboxView
              emails={emails}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onOpenEmail={(em) => setSelectedEmailModal(em)}
              onArchiveToggle={handleArchiveToggle}
              onScheduleEvent={(em) => handleOpenActionModal(em, "event")}
              onAddTask={(em) => handleOpenActionModal(em, "task")}
            />
          )}

          {activeTab === "briefing" && (
            <DailyBriefingView
              items={briefingItems}
              onOpenOriginalEmail={(em) => setSelectedEmailModal(em)}
              onActionComplete={refreshAll}
              onOpenActionModal={handleOpenActionModal}
              onRefreshData={refreshAll}
              onNavigateToSummary={() => setActiveTab("summary")}
            />
          )}

          {activeTab === "priority-grid" && (
            <PriorityTilesView
              emails={emails}
              onOpenEmail={(em) => setSelectedEmailModal(em)}
              onScheduleEvent={(em) => handleOpenActionModal(em, "event")}
              onAddTask={(em) => handleOpenActionModal(em, "task")}
              onReply={handleReplyEmail}
            />
          )}

          {activeTab === "summary" && (
            <AiSummaryView
              selectedAccountId={selectedAccountId}
              onOpenEmail={(em) => setSelectedEmailModal(em)}
              onScheduleEvent={(em) => handleOpenActionModal(em, "event")}
              onAddTask={(em) => handleOpenActionModal(em, "task")}
            />
          )}

          {activeTab === "calendar-tasks" && (
            <CalendarTasksView onSelectEmailById={handleSelectEmailById} />
          )}

          {activeTab === "privacy" && (
            <PrivacyPanel
              accounts={accounts}
              onRefreshData={refreshAll}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              onRefreshData={refreshAll}
              onNavigateToPrivacy={() => setActiveTab("privacy")}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <EmailDetailModal
        email={selectedEmailModal}
        onClose={() => setSelectedEmailModal(null)}
        onActionComplete={refreshAll}
        onReply={handleReplyEmail}
      />

      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setComposeInitialData(null);
        }}
        onSuccess={(msg) => {
          showToast(msg);
          refreshAll();
        }}
        accounts={accounts}
        defaultAccountId={selectedAccountId}
        initialData={composeInitialData}
      />

      <ActionModal
        email={actionModalState.email}
        mode={actionModalState.mode}
        isOpen={actionModalState.isOpen}
        onClose={() =>
          setActionModalState({ email: null, mode: null, isOpen: false })
        }
        onSuccess={(msg, link) => {
          showToast(msg, link);
          refreshAll();
        }}
      />

      {/* Cookie Notice Banner */}
      <CookieNotice />
    </div>
  );
}
