"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { NotificationCard } from "@/components/NotificationCard";
import { api } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { NotificationItem } from "@/lib/types";

const DROPDOWN_PREVIEW_COUNT = 4;

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AT";
  const first = parts[0][0]?.toUpperCase() ?? "A";
  const last = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() ?? "" : "";
  return `${first}${last}`.slice(0, 2);
}

export function AppHeaderActions() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [displayName, setDisplayName] = useState("Atleta");
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.me(), api.getNotifications()])
      .then(([user, data]) => {
        setDisplayName(user.display_name);
        setNotifications(data.notifications);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notifOpen && !profileOpen) return;

    function handleClickOutside(event: MouseEvent): void {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [notifOpen, profileOpen]);

  async function logout(): Promise<void> {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    clearSession();
    router.push("/login");
  }

  async function handleMarkRead(notificationId: string): Promise<void> {
    setMarkingId(notificationId);
    try {
      const updated = await api.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? updated : n)),
      );
    } catch {
      /* ignore */
    } finally {
      setMarkingId(null);
    }
  }

  const preview = notifications.slice(0, DROPDOWN_PREVIEW_COUNT);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const initials = toInitials(displayName);

  return (
    <div ref={wrapperRef} className="flex shrink-0 items-center gap-2">
      <div className="relative">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card transition hover:border-accent"
          onClick={() => {
            setNotifOpen((prev) => !prev);
            setProfileOpen(false);
          }}
          aria-expanded={notifOpen}
          aria-haspopup="menu"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4 text-accent" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 top-12 z-40 w-[min(92vw,20rem)] rounded-xl border border-surface-border bg-surface-card p-2 shadow-xl shadow-black/30"
              role="menu"
            >
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notificações
              </p>
              <div className="mt-1 max-h-[min(60vh,22rem)] space-y-1.5 overflow-y-auto">
                {preview.length === 0 && (
                  <p className="rounded-lg px-2 py-3 text-center text-xs text-slate-400">
                    Sem notificações no momento.
                  </p>
                )}
                {preview.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    compact
                    onMarkRead={handleMarkRead}
                    marking={markingId === n.id}
                  />
                ))}
              </div>
              {notifications.length > DROPDOWN_PREVIEW_COUNT && (
                <p className="mt-1 px-2 text-[10px] text-slate-500">
                  +{notifications.length - DROPDOWN_PREVIEW_COUNT} outras
                </p>
              )}
              <Link
                href="/notifications"
                className="mt-2 block rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-center text-xs font-medium text-accent transition hover:bg-accent/20"
                onClick={() => setNotifOpen(false)}
              >
                Ver todas as notificações
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-2 py-1.5 transition hover:border-accent"
          onClick={() => {
            setProfileOpen((prev) => !prev);
            setNotifOpen(false);
          }}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-400 text-xs font-bold text-white">
            {initials}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition ${profileOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 top-12 z-40 w-44 rounded-xl border border-surface-border bg-surface-card p-1.5 shadow-xl shadow-black/30"
              role="menu"
            >
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-surface-muted"
                onClick={() => setProfileOpen(false)}
              >
                <User className="h-4 w-4 text-accent" />
                Ver perfil
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-surface-muted"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-4 w-4 text-accent" />
                Sair
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
