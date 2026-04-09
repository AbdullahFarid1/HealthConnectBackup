"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CalendarCheck2,
  CalendarX2,
  CalendarClock,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { NotificationDoc, NotificationType } from "@/types";
import { Button } from "@/components/ui/button";

const ICONS: Record<NotificationType, typeof Bell> = {
  booked: CalendarCheck2,
  cancelled: CalendarX2,
  rescheduled: CalendarClock,
  completed: CheckCircle2,
  "auto-confirmed": CheckCircle2,
  "auto-cancelled": Clock,
};

const COLORS: Record<NotificationType, string> = {
  booked: "text-blue-600",
  cancelled: "text-destructive",
  rescheduled: "text-amber-600",
  completed: "text-green-600",
  "auto-confirmed": "text-green-600",
  "auto-cancelled": "text-muted-foreground",
};

function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const sec = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationDoc[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setItems(await res.json());
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (unread === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-x-2 top-16 z-50 mx-auto max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:absolute lg:inset-x-auto lg:left-0 lg:top-full lg:mx-0 lg:mt-2 lg:w-80">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                const color = COLORS[n.type] ?? "text-muted-foreground";
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 border-b border-border/40 px-4 py-3 last:border-b-0 ${
                      n.read ? "" : "bg-blue-50/40 dark:bg-blue-500/5"
                    }`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="mt-0.5 break-words text-[11px] text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
