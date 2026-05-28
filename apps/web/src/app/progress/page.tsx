"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Flame,
  Scale,
  Target,
  TrendingUp,
} from "lucide-react";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { AppShell } from "@/components/AppShell";
import { ProgressSkeleton } from "@/components/skeleton";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ProgressSummary } from "@/lib/types";

export default function ProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [weightInput, setWeightInput] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api.getProgress().then(setProgress).catch(() => router.replace("/dashboard"));
  }, [router]);

  async function salvarPeso() {
    const parsed = Number(weightInput);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    await api.addMetric({ weight_kg: parsed });
    const updated = await api.getProgress();
    setProgress(updated);
    setWeightInput("");
  }

  if (!progress) {
    return <ProgressSkeleton />;
  }

  const maxWeight = Math.max(...progress.weight_progression.map((p) => p.value), 1);
  const maxConsistency = Math.max(...progress.consistency_progression.map((p) => p.value), 1);

  return (
    <AppShell
      title="Progresso"
      subtitle="Acompanhe evolução corporal e consistência dos treinos"
      backHref="/dashboard"
      activeTab="progress"
      rightSlot={<AppHeaderActions />}
    >
      <motion.div
        className="mt-4 grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <MetricCard
          label="Aderência"
          value={`${progress.adherence_pct}%`}
          icon={<Target className="h-3.5 w-3.5 text-accent" />}
        />
        <MetricCard
          label="Treinos concluídos"
          value={String(progress.completed_workouts)}
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
        />
        <MetricCard
          label="Streak"
          value={`${progress.streak_days} dias`}
          icon={<Flame className="h-3.5 w-3.5 text-orange-400" />}
        />
        <MetricCard
          label="Volume total"
          value={`${progress.total_volume_kg} kg`}
          icon={<Dumbbell className="h-3.5 w-3.5 text-accent" />}
          small
        />
      </motion.div>

      <motion.section
        className="panel mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="panel-title inline-flex items-center gap-2">
          <Scale className="h-4 w-4 text-accent" />
          Registrar peso
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {progress.latest_weight_kg
            ? `Último registro: ${progress.latest_weight_kg} kg`
            : "Ainda sem registro de peso."}
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Ex.: 78.5"
          />
          <button type="button" className="primary shrink-0 px-5" onClick={salvarPeso}>
            Salvar
          </button>
        </div>
      </motion.section>

      <motion.section
        className="panel mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <h2 className="panel-title inline-flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          Evolução do peso
        </h2>
        {progress.weight_progression.length > 1 && (
          <div className="mt-3 rounded-xl border border-surface-border bg-surface-muted/60 p-2">
            <LineChart points={progress.weight_progression} color="#22c55e" />
          </div>
        )}
        <div className="mt-3 space-y-2">
          {progress.weight_progression.length === 0 && (
            <p className="subtle">Sem dados de peso ainda.</p>
          )}
          {progress.weight_progression.map((p) => (
            <div
              key={p.date}
              className="rounded-xl border border-surface-border bg-surface-muted/40 px-3 py-2"
            >
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{formatDateLabel(p.date)}</span>
                <span className="font-medium text-slate-200">{p.value} kg</span>
              </div>
              <div className="h-2 rounded-full bg-surface">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-accent to-cyan-400"
                  style={{ width: `${(p.value / maxWeight) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="panel mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <h2 className="panel-title inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-accent" />
          Consistência semanal
        </h2>
        {progress.consistency_progression.length > 1 && (
          <div className="mt-3 rounded-xl border border-surface-border bg-surface-muted/60 p-2">
            <LineChart points={progress.consistency_progression} color="#60a5fa" />
          </div>
        )}
        <div className="mt-3 space-y-2">
          {progress.consistency_progression.length === 0 && (
            <p className="subtle">Sem sessões concluídas ainda.</p>
          )}
          {progress.consistency_progression.map((p) => (
            <div
              key={p.date}
              className="rounded-xl border border-surface-border bg-surface-muted/40 px-3 py-2"
            >
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{formatDateLabel(p.date)}</span>
                <span className="font-medium text-slate-200">{p.value} treino(s)</span>
              </div>
              <div className="h-2 rounded-full bg-surface">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${(p.value / maxConsistency) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>
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
      <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
        {icon}
        <span>{label}</span>
      </p>
      <p className={`mt-1 font-semibold ${small ? "text-sm" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function formatDateLabel(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function LineChart({
  points,
  color,
}: {
  points: ProgressSummary["weight_progression"];
  color: string;
}) {
  const width = 320;
  const height = 96;
  const maxY = Math.max(...points.map((p) => p.value), 1);
  const minY = Math.min(...points.map((p) => p.value), maxY);
  const range = Math.max(maxY - minY, 1);
  const path = points
    .map((point, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * (width - 16) + 8;
      const y = height - ((point.value - minY) / range) * (height - 16) - 8;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {points.map((point, idx) => {
        const x = (idx / Math.max(points.length - 1, 1)) * (width - 16) + 8;
        const y = height - ((point.value - minY) / range) * (height - 16) - 8;
        return <circle key={`${point.date}-${idx}`} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}
