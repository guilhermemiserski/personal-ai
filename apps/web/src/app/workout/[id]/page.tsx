"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BatteryCharging,
  CheckCircle2,
  Gauge,
  Image as ImageIcon,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Swords,
} from "lucide-react";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { AppShell } from "@/components/AppShell";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { WorkoutSkeleton } from "@/components/skeleton";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getExerciseImageSrc } from "@/lib/exerciseImage";
import type { Session, SessionExerciseLogInput, Workout } from "@/lib/types";

function applySessionLogs(
  session: Session,
  setCompleted: Dispatch<SetStateAction<Record<string, number>>>,
  setLoadKg: Dispatch<SetStateAction<Record<string, number>>>,
): void {
  if (!session.exercise_logs?.length) return;
  const completedMap: Record<string, number> = {};
  const loadMap: Record<string, number> = {};
  for (const log of session.exercise_logs) {
    completedMap[log.planned_exercise_id] = log.completed_sets;
    if (log.load_kg != null && log.load_kg > 0) {
      loadMap[log.planned_exercise_id] = log.load_kg;
    }
  }
  setCompleted(completedMap);
  setLoadKg(loadMap);
}

export default function WorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, number>>({});
  const [loadKg, setLoadKg] = useState<Record<string, number>>({});
  const [effort, setEffort] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [soreness, setSoreness] = useState(4);
  const [difficulty, setDifficulty] = useState(6);
  const [notes, setNotes] = useState("");
  const [adaptation, setAdaptation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadWorkout(): Promise<void> {
      setLoadError(null);
      setSessionError(null);
      try {
        const w = await api.getWorkoutById(workoutId);
        if (cancelled) return;
        setWorkout(w);
        if (w.is_completed) {
          setFinished(true);
          setAdaptation(w.adaptation_summary ?? "Treino já concluído nesta semana.");
          return;
        }
        await beginSession(w.id);
      } catch {
        if (!cancelled) {
          setLoadError("Não foi possível carregar este treino.");
        }
      }
    }

    async function beginSession(plannedWorkoutId: string): Promise<void> {
      try {
        const session = await api.startSession(plannedWorkoutId);
        if (!cancelled) {
          setSessionId(session.id);
          applySessionLogs(session, setCompleted, setLoadKg);
          setSessionError(null);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 409) {
            setFinished(true);
            setAdaptation("Este treino já foi concluído nesta semana.");
            return;
          }
          setSessionError(
            "Não foi possível iniciar a sessão agora. Você ainda pode registrar o treino — toque em tentar novamente.",
          );
        }
      }
    }

    void loadWorkout();

    return () => {
      cancelled = true;
    };
  }, [workoutId, router]);

  async function retrySession(): Promise<void> {
    if (!workout || finished) return;
    setSessionError(null);
    try {
      const session = await api.startSession(workout.id);
      setSessionId(session.id);
      applySessionLogs(session, setCompleted, setLoadKg);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFinished(true);
        setAdaptation("Este treino já foi concluído nesta semana.");
        return;
      }
      setSessionError("Ainda não foi possível iniciar a sessão. Aguarde um instante e tente de novo.");
    }
  }

  const logs = useMemo<SessionExerciseLogInput[]>(() => {
    if (!workout) return [];
    return workout.exercises.map((ex) => ({
      planned_exercise_id: ex.id,
      completed_sets: completed[ex.id] ?? 0,
      completed_reps: ex.reps,
      load_kg: loadKg[ex.id] ?? 0,
      rpe: effort,
    }));
  }, [completed, effort, loadKg, workout]);

  async function finalizarTreino() {
    if (!sessionId || finished) return;
    setSaving(true);
    try {
      await api.updateSession(sessionId, logs);
      const session = await api.finishSessionFeedback(sessionId, {
        completed: true,
        perceived_effort: effort,
        energy_level: energy,
        soreness_level: soreness,
        difficulty_level: difficulty,
        notes,
      });
      setAdaptation(session.adaptation_summary ?? "Treino finalizado!");
      setFinished(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFinished(true);
        setAdaptation("Este treino já foi finalizado.");
      } else {
        setAdaptation("Não foi possível salvar agora. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!workout) {
    if (loadError) {
      return (
        <AppShell
          title="Treino"
          backHref="/dashboard"
          activeTab="home"
          rightSlot={<AppHeaderActions />}
        >
          <div className="panel mt-6">
            <p className="text-sm text-slate-300">{loadError}</p>
            <Link
              href="/dashboard"
              className="primary mt-4 inline-block text-center"
            >
              Voltar ao início
            </Link>
          </div>
        </AppShell>
      );
    }
    return <WorkoutSkeleton />;
  }

  return (
    <AppShell
      title={workout.day_label}
      subtitle={`Duração estimada: ${workout.estimated_minutes} minutos`}
      backHref="/dashboard"
      activeTab="home"
      rightSlot={<AppHeaderActions />}
    >

      {finished && (
        <div className="panel mt-4 border-emerald-500/40 bg-emerald-500/10">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Treino concluído nesta semana
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Este treino já foi registrado. Volte na próxima semana ou escolha outro dia no plano.
          </p>
          <Link href="/dashboard" className="primary mt-3 inline-block w-full text-center">
            Voltar ao início
          </Link>
        </div>
      )}

      {sessionError && !finished && (
        <div className="panel mt-4 border-amber-500/40 bg-amber-500/10">
          <p className="text-sm text-amber-100">{sessionError}</p>
          <button type="button" className="secondary mt-3 w-full" onClick={retrySession}>
            Tentar novamente
          </button>
        </div>
      )}

      <AnimatedList className="mt-6 space-y-4">
        {workout.exercises.map((ex, i) => (
          <AnimatedListItem key={ex.id} className="panel">
            <div className="flex gap-3">
              <ExerciseThumbnail name={ex.name} imageUrl={ex.image_url} />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">Exercício {i + 1}</p>
                <h2 className="font-semibold">{ex.name}</h2>
                <p className="text-sm text-slate-400">
                  {ex.sets}×{ex.reps} · descanso {ex.rest_seconds}s
                  {ex.target_rpe ? ` · RPE ${ex.target_rpe}` : ""}
                </p>
                {ex.muscle_group && (
                  <p className="mt-1 text-xs text-accent">{ex.muscle_group}</p>
                )}
              </div>
            </div>
            {ex.instructions && (
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{ex.instructions}</p>
            )}
            {ex.alternatives && ex.alternatives.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                Alternativas: {ex.alternatives.join(", ")}
              </p>
            )}
            <ExerciseVideo url={ex.video_url ?? fallbackVideoSearchUrl(ex.name)} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Séries concluídas</label>
                <input
                  type="number"
                  min={0}
                  max={ex.sets}
                  value={completed[ex.id] ?? 0}
                  disabled={finished}
                  onChange={(e) =>
                    setCompleted((prev) => ({
                      ...prev,
                      [ex.id]: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Carga (kg)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={loadKg[ex.id] ?? ""}
                  disabled={finished}
                  placeholder="0"
                  onChange={(e) =>
                    setLoadKg((prev) => ({
                      ...prev,
                      [ex.id]: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </AnimatedListItem>
        ))}
      </AnimatedList>
      <motion.section
        className="panel mt-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="panel-title inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Feedback do treino
          </h3>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
            Escala de 1 a 10
          </span>
        </div>
        {!finished && (
          <p className="mt-2 text-xs text-slate-400">
            Quanto mais honesto o feedback, melhor seu treinador ajusta seu próximo treino.
          </p>
        )}
        {!finished && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <RangeField
                label="Esforço percebido (RPE)"
                helper="1 = muito leve • 10 = no limite"
                value={effort}
                onChange={setEffort}
                icon={<Gauge className="h-4 w-4 text-accent" />}
              />
              <RangeField
                label="Energia no treino"
                helper="1 = sem energia • 10 = energia alta"
                value={energy}
                onChange={setEnergy}
                icon={<BatteryCharging className="h-4 w-4 text-accent" />}
              />
              <RangeField
                label="Dor muscular (pós-treino)"
                helper="1 = sem dor • 10 = muita dor"
                value={soreness}
                onChange={setSoreness}
                icon={<ShieldAlert className="h-4 w-4 text-accent" />}
              />
              <RangeField
                label="Dificuldade geral"
                helper="1 = fácil • 10 = muito difícil"
                value={difficulty}
                onChange={setDifficulty}
                icon={<Swords className="h-4 w-4 text-accent" />}
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-slate-400">Observações (opcional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: senti desconforto no joelho no agachamento, mas o restante foi bem."
              />
            </div>
            <button
              type="button"
              className="primary mt-4 w-full text-center"
              onClick={finalizarTreino}
              disabled={saving || !sessionId}
            >
              {saving ? "Salvando..." : "Finalizar treino"}
            </button>
          </>
        )}
        {adaptation && (
          <div
            className={`mt-3 rounded-xl border p-3 text-sm ${
              finished
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-accent/30 bg-accent/10"
            }`}
          >
            <p className="font-medium">{finished ? "Resumo" : "Adaptação sugerida"}</p>
            <p className="text-slate-300">{adaptation}</p>
          </div>
        )}
      </motion.section>
    </AppShell>
  );
}

function ExerciseThumbnail({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const resolvedSrc = getExerciseImageSrc(name, imageUrl);
  const [src, setSrc] = useState(resolvedSrc);
  const [showIcon, setShowIcon] = useState(false);

  useEffect(() => {
    setSrc(getExerciseImageSrc(name, imageUrl));
    setShowIcon(false);
  }, [imageUrl, name]);

  if (showIcon) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-surface-border bg-surface-muted">
        <ImageIcon className="h-5 w-5 text-slate-400" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={name}
      className="h-16 w-16 rounded-lg object-cover"
      loading="lazy"
      onError={() => setShowIcon(true)}
    />
  );
}

function RangeField({
  label,
  helper,
  value,
  onChange,
  icon,
}: {
  label: string;
  helper: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-2.5">
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-200">
        {icon}
        <span>{label}</span>
      </label>
      <p className="mb-2 text-[11px] text-slate-400">{helper}</p>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="mt-1 text-xs font-semibold text-accent">{value}/10</p>
    </div>
  );
}

function ExerciseVideo({ url }: { url: string }) {
  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-surface-border">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Demonstração do exercício"
          className="h-44 w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
    >
      <PlayCircle className="h-3.5 w-3.5" />
      Ver demonstração
    </a>
  );
}

function fallbackVideoSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} execução exercício`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

function extractYoutubeId(url: string): string | null {
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (longMatch) return longMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch) return embedMatch[1];
  return null;
}
