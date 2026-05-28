export const EXPERIENCE_OPTIONS = [
  { value: "never", label: "Nunca treinei" },
  { value: "beginner", label: "Iniciante (0–6 meses)" },
  { value: "intermediate", label: "Intermediário (6 meses–2 anos)" },
  { value: "advanced", label: "Avançado (2+ anos)" },
] as const;

export const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Perda de peso" },
  { value: "hypertrophy", label: "Ganho muscular" },
  { value: "strength", label: "Ganho de força" },
  { value: "recomposition", label: "Recomposição corporal" },
  { value: "health", label: "Saúde geral" },
  { value: "athletic", label: "Performance atlética" },
  { value: "endurance", label: "Resistência" },
] as const;

export const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90+ min" },
] as const;

export const GYM_OPTIONS = [
  { value: "full_gym", label: "Academia completa" },
  { value: "home_gym", label: "Academia em casa" },
  { value: "bodyweight", label: "Só peso corporal" },
  { value: "limited", label: "Equipamento limitado" },
] as const;

export const INJURY_OPTIONS = [
  "shoulder",
  "knee",
  "lower_back",
  "mobility",
] as const;

export const INJURY_LABELS: Record<string, string> = {
  shoulder: "Lesão no ombro",
  knee: "Dor no joelho",
  lower_back: "Dor lombar",
  mobility: "Restrição de mobilidade",
};

export const STYLE_OPTIONS = [
  { value: "bodybuilding", label: "Musculação" },
  { value: "functional", label: "Funcional" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "cross", label: "Cross training" },
  { value: "mixed", label: "Misto" },
] as const;

export const CARDIO_LEVELS = [
  { value: "low", label: "Baixo" },
  { value: "medium", label: "Médio" },
  { value: "high", label: "Alto" },
] as const;

export const STRENGTH_LEVELS = [
  { value: "low", label: "Baixo" },
  { value: "medium", label: "Médio" },
  { value: "high", label: "Alto" },
] as const;

export const ONBOARDING_STEPS = [
  "Dados pessoais",
  "Experiência",
  "Objetivo",
  "Disponibilidade",
  "Equipamento",
  "Lesões",
  "Preferências",
  "Análise do seu treinador",
] as const;
