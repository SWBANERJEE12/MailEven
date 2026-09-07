"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckSquare,
  Clock,
  MapPin,
  ExternalLink,
  Check,
  CalendarCheck,
  Mail,
} from "lucide-react";
import { format } from "date-fns";

interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime: string;
  htmlLink?: string | null;
  calendarId?: string | null;
  email?: {
    id: string;
    subject: string;
    senderName?: string | null;
    sender: string;
  } | null;
}

interface TaskItemData {
  id: string;
  title: string;
  notes?: string | null;
  due?: string | null;
  status: string;
  isCompleted: boolean;
  taskListId?: string | null;
  email?: {
    id: string;
    subject: string;
    senderName?: string | null;
    sender: string;
  } | null;
}

interface CalendarTasksViewProps {
  onSelectEmailById: (emailId: string) => void;
}

export default function CalendarTasksView({ onSelectEmailById }: CalendarTasksViewProps) {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "events" | "tasks">("all");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/calendar-tasks");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTaskCompletion = async (taskId: string, current: boolean) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !current } : t))
      );
      await fetch("/api/calendar-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, isCompleted: !current }),
      });
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo dark:text-steelteal" />
            <span>Calendar & Tasks Hub</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Manage scheduled events and tasks created directly from email briefings.
          </p>
        </div>

        {/* View Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-surface-borderSubtle">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-surface-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            All ({events.length + tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "events"
                ? "bg-surface-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Calendar ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "tasks"
                ? "bg-surface-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Tasks ({tasks.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted text-xs">Loading scheduled items...</div>
      ) : events.length === 0 && tasks.length === 0 ? (
        <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center flex flex-col items-center shadow-sm">
          <CalendarCheck className="w-12 h-12 text-muted/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">No actions scheduled yet</h3>
          <p className="text-xs text-muted mt-1 max-w-sm">
            Review your Daily Briefing or tap "Schedule Event" / "Add Task" from any email card in your inbox.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Events Column */}
          {(activeTab === "all" || activeTab === "events") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-indigo dark:text-steelteal" />
                  <span>Calendar Events</span>
                </h3>
                <span className="text-xs text-muted font-medium">{events.length} events</span>
              </div>

              {events.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surface-card border border-surface-border text-center text-xs text-muted">
                  No calendar events scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-indigo/40 dark:hover:border-steelteal/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-surface-elevated text-muted">
                              {ev.calendarId === "primary" ? "Primary Calendar" : ev.calendarId || "Calendar"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground group-hover:text-indigo dark:group-hover:text-steelteal transition-colors">
                            {ev.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted mt-1">
                            <Clock className="w-3.5 h-3.5 text-indigo dark:text-steelteal" />
                            <span>{format(new Date(ev.startTime), "PPp")}</span>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-muted" />
                              <span className="truncate max-w-xs">{ev.location}</span>
                            </div>
                          )}
                        </div>

                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-indigo dark:text-steelteal hover:bg-surface-elevated rounded-xl transition-colors"
                            title="Open in Google Calendar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Source email badge */}
                      {ev.email && (
                        <div className="mt-3 pt-2.5 border-t border-surface-borderSubtle flex items-center justify-between text-xs">
                          <button
                            onClick={() => onSelectEmailById(ev.email!.id)}
                            className="text-muted hover:text-indigo dark:hover:text-steelteal flex items-center gap-1.5 truncate max-w-sm transition-colors"
                          >
                            <Mail className="w-3 h-3 text-indigo dark:text-steelteal flex-shrink-0" />
                            <span className="truncate">{ev.email.subject}</span>
                          </button>
                          <span className="text-[10px] text-muted">Source Email</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Google Tasks Column */}
          {(activeTab === "all" || activeTab === "tasks") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <CheckSquare className="w-4 h-4 text-indigo dark:text-steelteal" />
                  <span>Tasks</span>
                </h3>
                <span className="text-xs text-muted font-medium">{tasks.length} tasks</span>
              </div>

              {tasks.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surface-card border border-surface-border text-center text-xs text-muted">
                  No tasks created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl bg-surface-card border transition-all ${
                        task.isCompleted
                          ? "border-surface-borderSubtle opacity-60"
                          : "border-surface-border hover:border-indigo/40 dark:hover:border-steelteal/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTaskCompletion(task.id, task.isCompleted)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            task.isCompleted
                              ? "bg-indigo dark:bg-steelteal border-indigo dark:border-steelteal text-white"
                              : "border-surface-border hover:border-indigo dark:hover:border-steelteal"
                          }`}
                        >
                          {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm font-bold ${
                              task.isCompleted
                                ? "line-through text-muted"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.notes && (
                            <p className="text-xs text-muted mt-1 line-clamp-2">
                              {task.notes}
                            </p>
                          )}

                          {task.due && (
                            <div className="flex items-center gap-1 text-[11px] text-indigo dark:text-steelteal mt-1.5 font-medium">
                              <Clock className="w-3 h-3" />
                              <span>Due: {format(new Date(task.due), "PP")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Source email badge */}
                      {task.email && (
                        <div className="mt-3 pt-2.5 border-t border-surface-borderSubtle flex items-center justify-between text-xs">
                          <button
                            onClick={() => onSelectEmailById(task.email!.id)}
                            className="text-muted hover:text-indigo dark:hover:text-steelteal flex items-center gap-1.5 truncate max-w-sm transition-colors"
                          >
                            <Mail className="w-3 h-3 text-indigo dark:text-steelteal flex-shrink-0" />
                            <span className="truncate">{task.email.subject}</span>
                          </button>
                          <span className="text-[10px] text-muted">Source Email</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
