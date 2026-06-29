"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { AppShell } from "@/components/AppShell";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import { ProfileSkeleton } from "@/components/skeleton";
import { api, ApiError } from "@/lib/api";
import type { AchievementItem, NotificationItem, Profile } from "@/lib/types";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Perda de peso",
  hypertrophy: "Ganho muscular",
  strength: "Força",
  recomposition: "Recomposição",
  health: "Saúde",
  athletic: "Atlético",
  endurance: "Resistência",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [weight, setWeight] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("3");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getProfile(), api.getNotifications(), api.getAchievements()])
      .then(([p, n, a]) => {
        setProfile(p);
        setDisplayName(p.display_name ?? "");
        setWeight(p.weight_kg ? String(p.weight_kg) : "");
        setDaysPerWeek(String(p.days_per_week ?? 3));
        setNotifications(n.notifications);
        setAchievements(a.achievements);
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  async function salvarPerfil() {
    if (!profile) return;
    setSaving(true);
    setMessage("");
    setError("");
    const payload: Partial<Profile> = {};
    if (displayName.trim().length >= 2) payload.display_name = displayName.trim();
    if (weight.trim() !== "") payload.weight_kg = Number(weight);
    if (daysPerWeek.trim() !== "") payload.days_per_week = Number(daysPerWeek);

    try {
      const previousDays = profile.days_per_week ?? null;
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      setDaysPerWeek(String(updated.days_per_week ?? 3));
      setMessage("Perfil salvo com sucesso.");

      if (previousDays !== updated.days_per_week) {
        setRegenerating(true);
        await api.completeOnboarding();
        setMessage("Dias por semana alterados. Novo plano de treino gerado com sucesso.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar seu perfil.");
    } finally {
      setSaving(false);
      setRegenerating(false);
    }
  }

  async function gerarNovoTreinoAgora() {
    setRegenerating(true);
    setMessage("");
    setError("");
    try {
      await api.completeOnboarding();
      setMessage("Novo plano gerado. Redirecionando para o dashboard…");
      setTimeout(() => router.push("/dashboard"), 700);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível gerar um novo plano agora. Tente novamente.",
      );
    } finally {
      setRegenerating(false);
    }
  }

  if (!profile) {
    return <ProfileSkeleton />;
  }

  return (
    <AppShell
      title="Perfil"
      subtitle="Ajuste seus dados e personalize seu plano"
      backHref="/dashboard"
      activeTab="profile"
      rightSlot={<AppHeaderActions />}
    >
      <section className="panel mt-1">
        <h2 className="panel-title">Dados</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          <p>E-mail e autenticação: ativo</p>
          <p>Objetivo: {GOAL_LABELS[profile.primary_goal ?? ""] ?? "não definido"}</p>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-slate-400">Nome</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome"
            minLength={2}
          />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-slate-400">Peso atual (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-slate-400">Dias de treino por semana</label>
          <AnimatedDropdown
            value={daysPerWeek}
            onChange={setDaysPerWeek}
            options={[
              { value: "1", label: "1 dia" },
              { value: "2", label: "2 dias" },
              { value: "3", label: "3 dias" },
              { value: "4", label: "4 dias" },
              { value: "5", label: "5 dias" },
              { value: "6", label: "6 dias" },
              { value: "7", label: "7 dias" },
            ]}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Se você alterar este valor, vamos gerar automaticamente um novo plano.
          </p>
        </div>
        <button type="button" className="primary mt-3" onClick={salvarPerfil} disabled={saving || regenerating}>
          {saving ? "Salvando…" : regenerating ? "Gerando novo plano…" : "Salvar perfil"}
        </button>
        {message && <p className="mt-2 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </section>

      <section className="panel mt-5">
        <h2 className="panel-title">Novo plano de treino</h2>
        <p className="mt-2 text-sm text-slate-400">
          Quer refazer toda a avaliação ou apenas gerar um novo treino com seu perfil atual?
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="secondary"
            onClick={() => router.push("/onboarding")}
            disabled={regenerating}
          >
            Refazer onboarding
          </button>
          <button
            type="button"
            className="primary"
            onClick={gerarNovoTreinoAgora}
            disabled={regenerating}
          >
            {regenerating ? "Gerando…" : "Gerar novo treino agora"}
          </button>
        </div>
      </section>

      <section className="panel mt-5">
        <h2 className="panel-title">Notificações</h2>
        <div className="mt-3 space-y-2">
          {notifications.length === 0 && (
            <p className="subtle">Nenhuma notificação.</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="rounded-xl border border-surface-border bg-surface-muted p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{n.type}</p>
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-slate-400">{n.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel mt-5">
        <h2 className="panel-title">Conquistas</h2>
        <div className="mt-3 space-y-2">
          {achievements.length === 0 && (
            <p className="subtle">Ainda sem conquistas.</p>
          )}
          {achievements.map((a) => (
            <div key={a.id} className="rounded-xl border border-accent/30 bg-accent/10 p-3">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-slate-300">{a.description}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
