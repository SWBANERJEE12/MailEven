"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Sparkles, AlertCircle, Send, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  summary?: string | null;
  isRead: boolean;
  emailId?: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  onSelectEmail?: (emailId: string) => void;
}

export default function NotificationBell({ onSelectEmail }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">("default");
  const [isSimulating, setIsSimulating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleAsRead = async (id: string, emailId?: string | null) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (emailId && onSelectEmail) {
        onSelectEmail(emailId);
        setIsOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("Browser push notifications are not supported in this browser.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPushStatus(perm);

      if (perm === "granted" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();

        if (!sub) {
          // If public VAPID key is configured
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (vapidKey) {
            const newSub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidKey,
            });
            await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscription: newSub }),
            });
          }
        }
        new Notification("MailEven Notifications Enabled", {
          body: "You will now receive instant AI briefings when new emails sync.",
          icon: "/logo.png",
        });
      }
    } catch (e) {
      console.error("Push permission error:", e);
    }
  };

  const handleSimulateNewEmail = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const data = await res.json();
      await fetchNotifications();

      // Trigger native notification if permission granted
      if (pushStatus === "granted" && "Notification" in window) {
        new Notification("MailEven: New Synced Email", {
          body: data.message || "New actionable email received and analyzed.",
          icon: "/logo.png",
        });
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-muted-light hover:text-white hover:bg-surface-elevated transition-colors border border-surface-borderSubtle"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-accent/40 animate-pulse-subtle">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-surface-border flex items-center justify-between bg-surface-base">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <span className="font-semibold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-muted-light hover:text-accent transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Push permission banner */}
          {pushStatus !== "granted" && (
            <div className="bg-accent/10 border-b border-accent/20 p-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <AlertCircle className="w-4 h-4 text-accent flex-shrink-0" />
                <span>Enable desktop push briefings</span>
              </div>
              <button
                onClick={requestPushPermission}
                className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-surface-borderSubtle">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-muted-dark mt-1">
                  You will receive briefings here as new emails sync.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markSingleAsRead(n.id, n.emailId)}
                  className={`p-3.5 px-4 cursor-pointer transition-colors hover:bg-surface-elevated ${
                    !n.isRead ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                      )}
                      <h4 className="text-xs font-semibold text-white truncate max-w-[220px]">
                        {n.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {n.summary ? (
                    <div className="mt-1.5 p-2 bg-surface-base/60 rounded-lg border border-surface-borderSubtle flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-foreground leading-relaxed">
                        {n.summary}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-light mt-1 line-clamp-2">
                      {n.message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick simulator footer */}
          <div className="p-2.5 px-4 bg-surface-base border-t border-surface-border flex items-center justify-between">
            <span className="text-[11px] text-muted">Simulate mail sync:</span>
            <button
              onClick={handleSimulateNewEmail}
              disabled={isSimulating}
              className="text-xs text-accent hover:text-white hover:bg-accent/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              {isSimulating ? "Syncing..." : "Simulate Incoming Mail"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
