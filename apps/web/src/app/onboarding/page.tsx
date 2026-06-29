"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import {
  Activity,
  Dumbbell,
  HeartPulse,
  LoaderCircle,
  PersonStanding,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { OnboardingSkeleton } from "@/components/skeleton";
import { api, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import {
  CARDIO_LEVELS,
  DURATION_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  GYM_OPTIONS,
  INJURY_LABELS,
  INJURY_OPTIONS,
  ONBOARDING_STEPS,
  STRENGTH_LEVELS,
  STYLE_OPTIONS,
} from "@/lib/onboarding-options";

type DraftProfile = Partial<Profile> & { injuries?: string[] };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DraftProfile>({ injuries: [] });
  const [error, setError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  const saveStep = useCallback(async (patch: DraftProfile) => {
    const next = await new Promise<DraftProfile>((resolve) => {
      setDraft((prev) => {
        const merged = { ...prev, ...patch };
        resolve(merged);
        return merged;
      });
    });
    await api.updateProfile(next);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api
      .getProfile()
      .then((p) => setDraft({ ...p, injuries: p.injuries ?? [] }))
      .catch(() => undefined)
      .finally(() => setProfileLoading(false));
  }, [router]);

  async function nextStep(patch: DraftProfile) {
    setError("");
    try {
      await saveStep(patch);
      if (step < ONBOARDING_STEPS.length - 2) {
        setStep((s) => s + 1);
      } else {
        setStep(ONBOARDING_STEPS.length - 1);
        await runGeneration();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar");
    }
  }

  async function runGeneration() {
    setError("");
    try {
      await api.completeOnboarding();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao gerar plano");
      setStep(ONBOARDING_STEPS.length - 2);
    }
  }

  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;

  if (profileLoading) {
    return <OnboardingSkeleton />;
  }

  if (step === 7) {
    return <PlanGenerationLoader />;
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg p-4 pb-12">
      <header className="mb-6 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Onboarding</p>
        <h1 className="text-2xl font-bold">{ONBOARDING_STEPS[step]}</h1>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-card">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Etapa {step + 1} de {ONBOARDING_STEPS.length}
        </p>
      </header>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {step === 0 && (
        <StepPersonal
          draft={draft}
          onNext={(p) => nextStep(p)}
        />
      )}
      {step === 1 && (
        <StepSelect
          label="Experiência com treino"
          options={EXPERIENCE_OPTIONS}
          field="training_experience"
          draft={draft}
          onNext={(p) => nextStep(p)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <StepSelect
          label="Objetivo principal"
          options={GOAL_OPTIONS}
          field="primary_goal"
          draft={draft}
          onNext={(p) => nextStep(p)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepAvailability draft={draft} onNext={(p) => nextStep(p)} onBack={() => setStep(2)} />
      )}
      {step === 4 && (
        <StepSelect
          label="Acesso a equipamentos"
          options={GYM_OPTIONS}
          field="gym_access"
          draft={draft}
          onNext={(p) => nextStep(p)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <StepInjuries draft={draft} onNext={(p) => nextStep(p)} onBack={() => setStep(4)} />
      )}
      {step === 6 && (
        <StepPreferences draft={draft} onNext={(p) => nextStep(p)} onBack={() => setStep(5)} />
      )}
    </main>
  );
}

function StepPersonal({
  draft,
  onNext,
}: {
  draft: DraftProfile;
  onNext: (p: DraftProfile) => void;
}) {
  const [age, setAge] = useState(String(draft.age ?? ""));
  const [sex, setSex] = useState(draft.biological_sex ?? "male");
  const [height, setHeight] = useState(String(draft.height_cm ?? ""));
  const [weight, setWeight] = useState(String(draft.weight_kg ?? ""));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onNext({
          age: Number(age),
          biological_sex: sex,
          height_cm: Number(height),
          weight_kg: Number(weight),
        });
      }}
    >
      <Field label="Idade">
        <input
          aria-label="Idade"
          type="number"
          required
          min={13}
          max={100}
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </Field>
      <Field label="Sexo biológico">
        <AnimatedDropdown
          value={sex}
          onChange={setSex}
          options={[
            { value: "male", label: "Masculino" },
            { value: "female", label: "Feminino" },
            { value: "other", label: "Outro" },
          ]}
        />
      </Field>
      <Field label="Altura (cm)">
        <input
          aria-label="Altura (cm)"
          type="number"
          required
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
      </Field>
      <Field label="Peso (kg)">
        <input
          aria-label="Peso (kg)"
          type="number"
          required
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </Field>
      <button type="submit" className="primary w-full">
        Continuar
      </button>
    </form>
  );
}

function StepSelect({
  label,
  options,
  field,
  draft,
  onNext,
  onBack,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  field: keyof DraftProfile;
  draft: DraftProfile;
  onNext: (p: DraftProfile) => void;
  onBack: () => void;
}) {
  const current = draft[field] as string | undefined;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{label}</p>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`w-full rounded-lg border p-3 text-left text-sm transition ${
            current === opt.value
              ? "border-accent bg-accent/10"
              : "border-surface-border hover:border-gray-500"
          }`}
          onClick={() => onNext({ [field]: opt.value })}
        >
          {opt.label}
        </button>
      ))}
      <button type="button" className="secondary w-full" onClick={onBack}>
        Voltar
      </button>
    </div>
  );
}

function StepAvailability({
  draft,
  onNext,
  onBack,
}: {
  draft: DraftProfile;
  onNext: (p: DraftProfile) => void;
  onBack: () => void;
}) {
  const [days, setDays] = useState(draft.days_per_week ?? 3);
  const [duration, setDuration] = useState(draft.session_duration_minutes ?? 60);

  return (
    <div className="space-y-6">
      <Field label="Dias por semana">
        <input
          type="range"
          min={1}
          max={7}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-center text-lg font-semibold text-accent">{days} dias</p>
      </Field>
      <div>
        <p className="mb-2 text-sm text-gray-400">Tempo por treino</p>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`rounded-lg border p-3 text-sm ${
                duration === d.value ? "border-accent bg-accent/10" : "border-surface-border"
              }`}
              onClick={() => setDuration(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="secondary flex-1" onClick={onBack}>
          Voltar
        </button>
        <button
          type="button"
          className="primary flex-1"
          onClick={() => onNext({ days_per_week: days, session_duration_minutes: duration })}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function StepInjuries({
  draft,
  onNext,
  onBack,
}: {
  draft: DraftProfile;
  onNext: (p: DraftProfile) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(draft.injuries ?? []);
  const [notes, setNotes] = useState(draft.injury_notes ?? "");

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Opcional — selecione o que se aplica</p>
      {INJURY_OPTIONS.map((id) => (
        <button
          key={id}
          type="button"
          className={`w-full rounded-lg border p-3 text-left text-sm ${
            selected.includes(id) ? "border-accent bg-accent/10" : "border-surface-border"
          }`}
          onClick={() => toggle(id)}
        >
          {INJURY_LABELS[id]}
        </button>
      ))}
      <Field label="Observações">
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <button type="button" className="secondary flex-1" onClick={onBack}>
          Voltar
        </button>
        <button
          type="button"
          className="primary flex-1"
          onClick={() => onNext({ injuries: selected, injury_notes: notes || null })}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function StepPreferences({
  draft,
  onNext,
  onBack,
}: {
  draft: DraftProfile;
  onNext: (p: DraftProfile) => void;
  onBack: () => void;
}) {
  const [style, setStyle] = useState(draft.preferred_style ?? "");
  const [pushups, setPushups] = useState(draft.can_pushups ?? true);
  const [squat, setSquat] = useState(draft.can_squat ?? true);
  const [cardio, setCardio] = useState(draft.cardio_level ?? "medium");
  const [strength, setStrength] = useState(draft.strength_level ?? "medium");

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Estilo preferido (opcional)</p>
      <div className="flex flex-wrap gap-2">
        {STYLE_OPTIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs ${
              style === s.value ? "border-accent bg-accent/10" : "border-surface-border"
            }`}
            onClick={() => setStyle(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm">
        <input type="checkbox" checked={pushups} onChange={(e) => setPushups(e.target.checked)} />
        <PersonStanding className="h-4 w-4 text-accent" />
        <span>Consigo fazer flexões</span>
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm">
        <input type="checkbox" checked={squat} onChange={(e) => setSquat(e.target.checked)} />
        <ShieldCheck className="h-4 w-4 text-accent" />
        <span>Consigo agachar com boa forma</span>
      </label>
      <Field
        label="Nível de cardio"
        icon={<HeartPulse className="h-4 w-4 text-accent" aria-hidden />}
      >
        <AnimatedDropdown
          value={cardio}
          onChange={setCardio}
          options={CARDIO_LEVELS.map((c) => ({ value: c.value, label: c.label }))}
        />
      </Field>
      <Field label="Nível de força" icon={<Dumbbell className="h-4 w-4 text-accent" aria-hidden />}>
        <AnimatedDropdown
          value={strength}
          onChange={setStrength}
          options={STRENGTH_LEVELS.map((s) => ({ value: s.value, label: s.label }))}
        />
      </Field>
      <div className="flex gap-2">
        <button type="button" className="secondary flex-1" onClick={onBack}>
          Voltar
        </button>
        <button
          type="button"
          className="primary flex-1"
          data-testid="onboarding-generate-plan"
          onClick={() =>
            onNext({
              preferred_style: style || null,
              can_pushups: pushups,
              can_squat: squat,
              cardio_level: cardio,
              strength_level: strength,
            })
          }
        >
          Gerar meu plano
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm text-gray-400">
        {icon}
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}

function PlanGenerationLoader() {
  const steps: readonly string[] = [
    "Analisando seu nível e disponibilidade",
    "Montando divisão semanal inteligente",
    "Selecionando exercícios adequados ao seu perfil",
    "Ajustando volume e recuperação",
  ];

  return (
    <main className="app-container flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-accent/15 p-2">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Seu treinador em ação</p>
            <h2 className="text-xl font-semibold">Gerando seu plano personalizado</h2>
          </div>
        </div>
        <p className="subtle mb-5">
          Estamos criando um plano sob medida para seu objetivo, tempo disponível e condicionamento.
        </p>
        <div className="space-y-3">
          {steps.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-muted/70 px-3 py-2"
            >
              <LoaderCircle className="h-4 w-4 animate-spin text-accent" />
              <span className="text-sm text-slate-200">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2">
          <Activity className="h-4 w-4 text-accent" />
          <span className="text-sm text-slate-200">Isso pode levar alguns segundos.</span>
        </div>
      </div>
    </main>
  );
}
