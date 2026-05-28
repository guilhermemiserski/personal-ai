"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { AppShell } from "@/components/AppShell";
import { NotificationCard } from "@/components/NotificationCard";
import { AppShellSkeleton, Skeleton } from "@/components/skeleton";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(() => {
    return api.getNotifications().then((data) => setNotifications(data.notifications));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadNotifications()
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false));
  }, [router, loadNotifications]);

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

  async function handleMarkAllRead(): Promise<void> {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading) {
    return (
      <AppShellSkeleton>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-20 w-full rounded-xl" />
        <Skeleton className="mt-3 h-20 w-full rounded-xl" />
      </AppShellSkeleton>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppShell
      title="Notificações"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
          : "Todas lidas"
      }
      backHref="/dashboard"
      activeTab="home"
      rightSlot={<AppHeaderActions />}
    >
      {unreadCount > 0 && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="secondary inline-flex items-center gap-1.5 text-xs"
            disabled={markingAll}
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {markingAll ? "Marcando…" : "Marcar todas como lidas"}
          </button>
        </div>
      )}

      <section className="mt-3">
        {notifications.length === 0 ? (
          <div className="panel flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">Você não tem notificações ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                marking={markingId === n.id}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
