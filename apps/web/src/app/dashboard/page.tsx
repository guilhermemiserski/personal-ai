"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  FileDown,
  Flame,
  Goal,
  Lock,
  Medal,
  Scale,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { AppShell } from "@/components/AppShell";
import { DashboardSkeleton } from "@/components/skeleton";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { exportPlanToPdf } from "@/lib/exportPlanPdf";
import type {
  AchievementItem,
  PlanSummary,
  ProgressSummary,
  Workout,
} from "@/lib/types";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Perda de peso",
  hypertrophy: "Ganho muscular",
  strength: "Força",
  recomposition: "Recomposição",
  health: "Saúde",
  athletic: "Atlético",
  endurance: "Resistência",
};

const ACHIEVEMENT_STYLES = [
  "from-amber-400/25 via-amber-300/10 to-transparent border-amber-300/35",
  "from-blue-400/25 via-blue-300/10 to-transparent border-blue-300/35",
  "from-emerald-400/25 via-emerald-300/10 to-transparent border-emerald-300/35",
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [today, setToday] = useState<Workout | null>(null);
  const [profileWeight, setProfileWeight] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("Atleta");
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([
      api.me(),
      api.getActivePlan(),
      api.getTodayWorkout(),
      api.getProfile(),
      api.getAchievements(),
      api.getProgress(),
    ])
      .then(([user, p, todayWorkout, profile, achievementData, progressData]) => {
        if (cancelled) return;
        setDisplayName(user.display_name);
        setPlan(p);
        setToday(todayWorkout);
        setProfileWeight(profile.weight_kg ?? null);
        setAchievements(achievementData.achievements.slice(0, 3));
        setProgress(progressData);
      })
      .catch(() => {
        if (!cancelled) router.replace("/onboarding");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleExportPdf() {
    if (!plan) return;
    setExporting(true);
    try {
      exportPlanToPdf(plan, displayName);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  const firstName = displayName.split(" ")[0];

  return (
    <AppShell
      title={`Olá, ${firstName}`}
      subtitle="Seu plano personalizado para hoje"
      activeTab="home"
      rightSlot={<AppHeaderActions />}
    >
      {today && (
        <motion.section
          className="panel bg-gradient-to-r from-accent/20 to-cyan-500/10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.01 }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Treino de hoje</p>
          <h2 className="mt-1 text-xl font-semibold">{today.day_label}</h2>
          <p className="subtle mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5 text-accent" />
              ~{today.estimated_minutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5 text-accent" />
              {today.exercises.length} exercícios
            </span>
          </p>
          <Link
            href={`/workout/${today.id}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-center font-semibold text-white transition hover:bg-accent-muted"
          >
            {today.is_completed ? "Ver treino de hoje" : "Iniciar treino"}
          </Link>
        </motion.section>
      )}

      <motion.div
        className="mt-4 grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <MetricCard
          label="Peso"
          value={profileWeight ? `${profileWeight} kg` : "—"}
          icon={<Scale className="h-3.5 w-3.5 text-accent" />}
        />
        <MetricCard
          label="Dias/semana"
          value={String(plan?.workouts.length ?? "—")}
          icon={<CalendarDays className="h-3.5 w-3.5 text-accent" />}
        />
        <MetricCard
          label="Programa"
          value={plan?.weekly_split ?? "—"}
          icon={<Dumbbell className="h-3.5 w-3.5 text-accent" />}
          small
        />
        <MetricCard
          label="Objetivo"
          value={GOAL_LABELS[plan?.program_name.split("–")[1]?.trim() ?? ""] ?? "Personalizado"}
          icon={<Goal className="h-3.5 w-3.5 text-accent" />}
          small
        />
      </motion.div>

      {plan?.workouts && plan.workouts.length > 0 && (
        <WeekSummaryPanel
          plan={plan}
          today={today}
          progress={progress}
          onExportPdf={handleExportPdf}
        />
      )}

      {plan?.rationale && (
        <section className="panel mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dica do seu treinador</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[11px] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Treinador virtual
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{plan.rationale}</p>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="panel-title inline-flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" />
            Conquistas
          </h3>
          <span className="rounded-full border border-surface-border bg-surface-card px-2 py-0.5 text-xs text-slate-300">
            {achievements.length} badges
          </span>
        </div>
        <div className="grid gap-2">
          {achievements.length === 0 && (
            <div className="panel text-sm text-slate-400">
              <p className="inline-flex items-center gap-2 font-medium text-slate-300">
                <Lock className="h-4 w-4 text-slate-400" />
                Nenhuma badge desbloqueada ainda
              </p>
              <p className="mt-1">Complete mais treinos para liberar suas primeiras conquistas.</p>
            </div>
          )}
          {achievements.map((a, index) => {
            const tone = ACHIEVEMENT_STYLES[index % ACHIEVEMENT_STYLES.length];
            return (
              <div
                key={a.id}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-3 ${tone}`}
              >
                <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/10 blur-xl" />
                <div className="relative flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
                    {index === 0 ? (
                      <Trophy className="h-4 w-4 text-amber-200" />
                    ) : index === 1 ? (
                      <Medal className="h-4 w-4 text-blue-200" />
                    ) : (
                      <Star className="h-4 w-4 text-emerald-200" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{a.title}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-white/70">Desbloqueada</p>
                    <p className="mt-1 text-sm text-slate-100/90">{a.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  icon,
  small,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="panel">
      <p className="text-xs uppercase tracking-wide text-slate-400 inline-flex items-center gap-1.5">
        {icon}
        <span>{label}</span>
      </p>
      <p className={`mt-1 font-semibold ${small ? "text-sm" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function WeekSummaryPanel({
  plan,
  today,
  progress,
  onExportPdf,
}: {
  plan: PlanSummary;
  today: Workout | null;
  progress: ProgressSummary | null;
  onExportPdf: () => void;
}) {
  const workouts = plan.workouts;
  const completedIds = new Set(progress?.completed_workout_ids ?? []);
  const totalMinutes = workouts.reduce((sum, w) => sum + w.estimated_minutes, 0);
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
  const muscleGroups = [
    ...new Set(
      workouts.flatMap((w) =>
        w.exercises.map((ex) => ex.muscle_group).filter((g): g is string => Boolean(g)),
      ),
    ),
  ];
  const heaviestDay = workouts.reduce(
    (best, w) => (w.estimated_minutes > best.estimated_minutes ? w : best),
    workouts[0],
  );

  return (
    <motion.section
      className="panel mt-4 min-w-0 max-w-full overflow-visible"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="panel-title">Resumo da semana</h3>
        <div className="flex items-center gap-3">
          <button type="button" className="back-link" onClick={onExportPdf}>
            <span className="inline-flex items-center gap-1">
              <FileDown className="h-3.5 w-3.5" />
              Exportar PDF
            </span>
          </button>
          <Link href="/progress" className="text-xs text-accent hover:underline">
            Ver progresso
          </Link>
        </div>
      </div>

      {progress && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-surface-border bg-surface-muted/60 px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Aderência</p>
            <p className="mt-0.5 text-lg font-semibold text-accent">{progress.adherence_pct}%</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-muted/60 px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Streak</p>
            <p className="mt-0.5 inline-flex items-center justify-center gap-1 text-lg font-semibold">
              <Flame className="h-4 w-4 text-orange-400" />
              {progress.streak_days}
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-muted/60 px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Feitos (semana)</p>
            <p className="mt-0.5 text-lg font-semibold">{completedIds.size}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-surface-border bg-surface-muted/40 px-3 py-2">
          <p className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            Tempo planejado
          </p>
          <p className="mt-1 font-semibold">{totalMinutes} min/semana</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface-muted/40 px-3 py-2">
          <p className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Dumbbell className="h-3.5 w-3.5" />
            Volume
          </p>
          <p className="mt-1 font-semibold">{totalExercises} exercícios</p>
        </div>
      </div>

      {heaviestDay && (
        <p className="mt-3 text-xs text-slate-400">
          <Target className="mr-1 inline h-3.5 w-3.5 text-accent" />
          Dia mais longo: <span className="text-slate-200">{heaviestDay.day_label}</span> (
          {heaviestDay.estimated_minutes} min)
        </p>
      )}

      {muscleGroups.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-slate-400">
            Grupos trabalhados na semana ({muscleGroups.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[...muscleGroups].sort((a, b) => a.localeCompare(b, "pt-BR")).map((group) => (
              <span
                key={group}
                className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] text-accent"
              >
                {group}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 min-w-0 w-full">
        <p className="mb-2 text-xs text-slate-400">Deslize para ver todos os dias · toque para abrir o treino</p>
        <div className="horizontal-scroll">
          {workouts.map((w) => {
            const isToday = today?.id === w.id;
            const isDone = completedIds.has(w.id);
            return (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className={`min-w-[88px] shrink-0 rounded-xl border px-2 py-2 text-center transition hover:border-accent hover:bg-accent/10 ${
                  isDone
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : isToday
                      ? "border-accent bg-accent/15"
                      : "border-surface-border bg-surface-muted/50"
                }`}
              >
                <p
                  className={`truncate text-xs font-medium ${
                    isDone ? "text-emerald-400" : isToday ? "text-accent" : ""
                  }`}
                >
                  {shortDayLabel(w.day_label)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{w.estimated_minutes} min</p>
                <p className="text-[10px] text-slate-500">{w.exercises.length} ex.</p>
                {isDone && (
                  <span className="mt-1 inline-flex items-center justify-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Feito
                  </span>
                )}
                {isToday && !isDone && (
                  <span className="mt-1 inline-block rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Hoje
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function shortDayLabel(dayLabel: string): string {
  const first = dayLabel.split(/[\s–-]/)[0]?.trim();
  if (!first) return dayLabel.slice(0, 8);
  return first.length > 10 ? `${first.slice(0, 9)}…` : first;
}

