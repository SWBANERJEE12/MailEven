"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import LandingPage from "@/components/LandingPage";
import Navbar from "@/components/Navbar";
import InboxView from "@/components/InboxView";
import DailyBriefingView from "@/components/DailyBriefingView";
import CalendarTasksView from "@/components/CalendarTasksView";
import SettingsView from "@/components/SettingsView";
import EmailDetailModal, { EmailData } from "@/components/EmailDetailModal";
import ActionModal from "@/components/ActionModal";
import MailEvenLogo from "@/components/MailEvenLogo";
import { CheckCircle2, ExternalLink } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<"inbox" | "briefing" | "calendar-tasks" | "settings">("inbox");
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [briefingItems, setBriefingItems] = useState<EmailData[]>([]);
  const [selectedTag, setSelectedTag] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"inbox" | "archived">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEmailModal, setSelectedEmailModal] = useState<EmailData | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; link?: string } | null>(null);

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

  const fetchEmails = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTag && selectedTag !== "All") params.set("tag", selectedTag);
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (e) {
      console.error("Failed to fetch emails:", e);
    }
  }, [selectedTag, searchQuery, statusFilter]);

  const fetchBriefing = useCallback(async () => {
    try {
      const res = await fetch("/api/briefing");
      if (res.ok) {
        const data = await res.json();
        setBriefingItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch briefing items:", e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchEmails(), fetchBriefing()]);
  }, [fetchEmails, fetchBriefing]);

  useEffect(() => {
    if (session?.user) {
      refreshAll();
    }
  }, [session, refreshAll]);

  // Handle URL query params for opening specific email (e.g. from notification clicks)
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
    }
  }, []);

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4">
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
    <div className="min-h-screen bg-black text-foreground flex flex-col selection:bg-accent selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        briefingCount={briefingItems.length}
        onSync={handleSync}
        isSyncing={isSyncing}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectEmail={handleSelectEmailById}
        onRefreshData={refreshAll}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-surface-card border border-accent/40 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold text-white max-w-md">
          <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="flex-1">
            <span>{toastMessage.text}</span>
            {toastMessage.link && (
              <a
                href={toastMessage.link}
                target="_blank"
                rel="noreferrer"
                className="block text-accent underline mt-0.5 flex items-center gap-1 font-bold"
              >
                <span>Open in Google</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
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
          />
        )}

        {activeTab === "calendar-tasks" && (
          <CalendarTasksView onSelectEmailById={handleSelectEmailById} />
        )}

        {activeTab === "settings" && (
          <SettingsView onRefreshData={refreshAll} />
        )}
      </main>

      {/* Modals */}
      <EmailDetailModal
        email={selectedEmailModal}
        onClose={() => setSelectedEmailModal(null)}
        onActionComplete={refreshAll}
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
    </div>
  );
}
