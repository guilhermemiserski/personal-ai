import { Check } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import { formatNotificationDate } from "@/lib/formatDate";

const TYPE_LABELS: Record<string, string> = {
  recovery: "Recuperação",
  reminder: "Lembrete",
  achievement: "Conquista",
  system: "Sistema",
};

export function NotificationCard({
  notification,
  compact,
  onMarkRead,
  marking,
}: {
  notification: NotificationItem;
  compact?: boolean;
  onMarkRead?: (id: string) => void;
  marking?: boolean;
}) {
  const typeLabel = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        notification.is_read
          ? "border-surface-border bg-surface-card opacity-90"
          : "border-accent/30 bg-accent/10"
      } ${compact ? "" : "px-4 py-3"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{typeLabel}</p>
          {notification.is_read ? (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              <Check className="h-2.5 w-2.5" />
              Lida
            </span>
          ) : (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
              Nova
            </span>
          )}
        </div>
        <time className="shrink-0 text-[10px] text-slate-500">
          {formatNotificationDate(notification.created_at)}
        </time>
      </div>
      <p className={`font-medium text-slate-100 ${compact ? "text-sm" : ""}`}>{notification.title}</p>
      <p className={`mt-0.5 text-slate-400 ${compact ? "line-clamp-2 text-xs" : "text-sm"}`}>
        {notification.body}
      </p>
      {!notification.is_read && onMarkRead && (
        <button
          type="button"
          className="mt-2 text-[11px] font-medium text-accent hover:underline disabled:opacity-50"
          disabled={marking}
          onClick={() => onMarkRead(notification.id)}
        >
          {marking ? "Salvando…" : "Marcar como lida"}
        </button>
      )}
    </div>
  );
}
