"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  CheckSquare,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  Layers,
} from "lucide-react";
import { EmailData } from "./EmailDetailModal";

interface CalendarOption {
  id: string;
  summary: string;
  primary?: boolean;
}

interface TaskListOption {
  id: string;
  title: string;
}

interface ActionModalProps {
  email: EmailData | null;
  mode: "event" | "task" | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resultMsg: string, webLink?: string) => void;
}

export default function ActionModal({
  email,
  mode,
  isOpen,
  onClose,
  onSuccess,
}: ActionModalProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  // Pickers state
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [taskLists, setTaskLists] = useState<TaskListOption[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("primary");
  const [selectedTaskListId, setSelectedTaskListId] = useState("@default");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;

    // Fetch calendar lists and task lists for the connected account
    const accId = (email as any).connectedAccountId || "";
    fetch(`/api/calendar-tasks/pickers?accountId=${encodeURIComponent(accId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.calendars && Array.isArray(data.calendars)) {
          setCalendars(data.calendars);
          // Check remembered calendar for this account
          const storageKey = `maileven_last_cal_${accId || "default"}`;
          const remembered = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
          if (remembered && data.calendars.some((c: CalendarOption) => c.id === remembered)) {
            setSelectedCalendarId(remembered);
          } else {
            setSelectedCalendarId("primary");
          }
        }
        if (data.taskLists && Array.isArray(data.taskLists)) {
          setTaskLists(data.taskLists);
          setSelectedTaskListId(data.taskLists[0]?.id || "@default");
        }
      })
      .catch((err) => console.warn("Pickers fetch error:", err));

    if (mode === "event") {
      const proposal = email.eventProposal;
      setTitle(proposal?.title || email.subject);
      setLocation(proposal?.location || "Google Meet");
      setDescription(
        proposal?.description ||
          `Context from email (${email.sender}): ${email.summary}`
      );

      const start = proposal?.startTime
        ? new Date(proposal.startTime)
        : new Date(Date.now() + 86400000);
      const end = proposal?.endTime
        ? new Date(proposal.endTime)
        : new Date(start.getTime() + 3600000);

      setStartTime(toDatetimeLocal(start));
      setEndTime(toDatetimeLocal(end));
    } else if (mode === "task") {
      const proposal = email.taskProposal;
      setTitle(proposal?.title || email.subject);
      setNotes(
        proposal?.notes ||
          `From ${email.senderName || email.sender}: ${email.summary}`
      );
      setPriority(proposal?.priority || "medium");

      const due = proposal?.dueDate
        ? new Date(proposal.dueDate)
        : new Date(Date.now() + 86400000 * 2);
      setDueDate(due.toISOString().split("T")[0]);
    }
  }, [email, mode]);

  if (!isOpen || !email || !mode) return null;

  function toDatetimeLocal(d: Date) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  }

  const handleCalendarChange = (calId: string) => {
    setSelectedCalendarId(calId);
    const accId = (email as any).connectedAccountId || "default";
    if (typeof window !== "undefined") {
      localStorage.setItem(`maileven_last_cal_${accId}`, calId);
    }
  };

  const handleConfirmEvent = async () => {
    if (!title.trim() || !startTime || !endTime) {
      setErrorMsg("Please provide a title, start time, and end time.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/actions/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          title,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          location,
          description,
          calendarId: selectedCalendarId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Google Calendar event.");
      }

      onSuccess(
        `Event "${title}" scheduled on ${selectedCalendarId === "primary" ? "Primary Calendar" : selectedCalendarId}!`,
        data.event?.htmlLink
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTask = async () => {
    if (!title.trim()) {
      setErrorMsg("Please provide a task title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/actions/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          title,
          due: dueDate ? new Date(dueDate).toISOString() : null,
          notes,
          taskListId: selectedTaskListId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add Google Task.");
      }

      onSuccess(`Task "${title}" added to Google Tasks!`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-surface-border bg-surface-elevated flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo/15 dark:bg-steelteal/20 text-indigo dark:text-steelteal flex items-center justify-center">
              {mode === "event" ? <Calendar className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                {mode === "event" ? "Confirm Google Calendar Event" : "Confirm Google Task"}
              </h3>
              <p className="text-[11px] text-muted">
                Pre-filled from email by Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-highlight transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Calendar Picker ("Add to:" dropdown) */}
          {mode === "event" && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo dark:text-steelteal" />
                <span>Add to Calendar:</span>
              </label>
              <select
                value={selectedCalendarId}
                onChange={(e) => handleCalendarChange(e.target.value)}
                className="w-full bg-surface-base border border-surface-border rounded-xl px-3.5 py-2 text-xs text-foreground font-medium focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors"
              >
                {calendars.length > 0 ? (
                  calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.summary} {cal.primary ? "(Primary)" : ""}
                    </option>
                  ))
                ) : (
                  <option value="primary">Primary Calendar</option>
                )}
              </select>
            </div>
          )}

          {/* Task List Picker (Only if user has more than 1 task list) */}
          {mode === "task" && taskLists.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo dark:text-steelteal" />
                <span>Add to Task List:</span>
              </label>
              <select
                value={selectedTaskListId}
                onChange={(e) => setSelectedTaskListId(e.target.value)}
                className="w-full bg-surface-base border border-surface-border rounded-xl px-3.5 py-2 text-xs text-foreground font-medium focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors"
              >
                {taskLists.map((tl) => (
                  <option key={tl.id} value={tl.id}>
                    {tl.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              {mode === "event" ? "Event Title" : "Task Name"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-base border border-surface-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors font-medium"
              placeholder={mode === "event" ? "Meeting title..." : "Task description..."}
            />
          </div>

          {mode === "event" ? (
            <>
              {/* Event Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo dark:text-steelteal" />
                    <span>Start Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo dark:text-steelteal" />
                    <span>End Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo dark:text-steelteal" />
                  <span>Location or Meeting URL</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Google Meet, Zoom, or Office Room"
                  className="w-full bg-surface-base border border-surface-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo dark:text-steelteal" />
                  <span>Calendar Description / Context</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors resize-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Task Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo dark:text-steelteal" />
                    <span>Due Date</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo dark:text-steelteal" />
                  <span>Task Notes</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-indigo dark:focus:border-steelteal transition-colors resize-none"
                />
              </div>
            </>
          )}

          {/* Email Reference Snippet */}
          <div className="p-3 bg-surface-base rounded-xl border border-surface-borderSubtle text-[11px] text-muted flex items-start gap-2">
            <span className="text-indigo dark:text-steelteal font-bold">Source:</span>
            <span className="truncate">
              {email.subject} ({email.senderName || email.sender})
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-elevated border-t border-surface-border flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-surface-card hover:bg-surface-highlight text-muted hover:text-foreground text-xs font-semibold rounded-xl transition-colors border border-surface-borderSubtle"
          >
            Cancel
          </button>
          <button
            onClick={mode === "event" ? handleConfirmEvent : handleConfirmTask}
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo text-white dark:bg-steelteal text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : mode === "event" ? (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>Confirm & Schedule</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Confirm & Add Task</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
