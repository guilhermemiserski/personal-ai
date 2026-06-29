"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { AppShell } from "@/components/AppShell";
import { CoachSkeleton } from "@/components/skeleton";
import { api } from "@/lib/api";
import type { CoachMessage } from "@/lib/types";

export default function CoachPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [text, setText] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .getCoachMessages()
      .then(setMessages)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setPageLoading(false));
  }, [router]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) return;
    setSending(true);
    try {
      const optimistic: CoachMessage = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      const response = await api.sendCoachMessage(text);
      setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), optimistic, response]);
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (pageLoading) {
    return <CoachSkeleton />;
  }

  return (
    <AppShell
      title="Seu treinador"
      subtitle="Pergunte sobre treino, recuperação e evolução"
      backHref="/dashboard"
      activeTab="coach"
      rightSlot={<AppHeaderActions />}
    >

      <div className="panel mt-1 h-[62vh] space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="rounded-xl border border-surface-border bg-surface-muted p-4 text-sm text-slate-400">
            Pergunte algo como: “faltou treino essa semana, como ajustar?”.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-3 text-sm ${
              m.role === "assistant"
                ? "border border-surface-border bg-surface-muted"
                : "ml-10 bg-accent/20 text-slate-100"
            }`}
          >
            <p className="mb-1 text-xs text-slate-400">{m.role === "assistant" ? "Coach" : "Você"}</p>
            <p>{m.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={enviar} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex.: meu ombro dói no supino, como ajustar?"
        />
        <button type="submit" className="primary" disabled={sending}>
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </AppShell>
  );
}
