import { resolveApiUrl } from "./apiBase";
import { clearSession } from "./auth";
import type {
  AchievementItem,
  BodyMetricInput,
  CoachMessage,
  NotificationItem,
  PlanSummary,
  Profile,
  ProgressSummary,
  Session,
  SessionExerciseLogInput,
  TokenResponse,
  UserMe,
  Workout,
} from "./types";

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 20_000;
const COLD_START_STATUSES = new Set([502, 503, 504]);
const COLD_START_MESSAGE =
  "Servidor iniciando (plano gratuito do Render). Aguarde até 1 minuto e tente novamente.";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await executeRequest<T>(path, options);
    } catch (error) {
      const shouldRetry =
        error instanceof ApiError &&
        COLD_START_STATUSES.has(error.status) &&
        attempt < maxAttempts;
      if (!shouldRetry) {
        throw error;
      }
      await sleep(4_000 * attempt);
    }
  }

  throw new ApiError(503, COLD_START_MESSAGE);
}

async function executeRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal ?? controller.signal;
  const { timeoutMs: _timeoutMs, ...requestOptions } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers,
      signal,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "A API demorou demais para responder. Tente novamente.");
    }
    throw new ApiError(0, "Sem conexão com o servidor. Verifique sua internet.");
  } finally {
    clearTimeout(timeoutId);
  }
  if (!response.ok) {
    if (COLD_START_STATUSES.has(response.status)) {
      throw new ApiError(response.status, COLD_START_MESSAGE);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? ((await response.json().catch(() => ({}))) as {
          detail?: string | Array<{ msg?: string }>;
        })
      : {};
    let detail = "Erro na requisição";
    if (typeof body.detail === "string") {
      detail = body.detail;
    } else if (Array.isArray(body.detail) && body.detail.length > 0) {
      detail = body.detail.map((item) => item.msg).filter(Boolean).join("; ") || detail;
    }
    const isAuthAttempt = path === "/auth/login" || path === "/auth/register";
    if (response.status === 401 && !isAuthAttempt) {
      clearSession();
      detail = "Sessão expirada. Faça login novamente.";
      if (typeof window !== "undefined") {
        const pagePath = window.location.pathname;
        if (pagePath !== "/login" && pagePath !== "/register") {
          window.location.replace("/login");
        }
      }
    }
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string, display_name?: string) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: display_name || null }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<UserMe>("/auth/me"),

  getProfile: () => request<Profile>("/me/profile"),

  updateProfile: (data: Partial<Profile>) =>
    request<Profile>("/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  completeOnboarding: () =>
    request<PlanSummary>("/me/onboarding/complete", { method: "POST", timeoutMs: 120_000 }),

  getActivePlan: () => request<PlanSummary>("/me/plan/active"),

  enrichPlanImages: () =>
    request<{ updated: number }>("/me/plan/enrich-images", { method: "POST" }),

  getTodayWorkout: () => request<Workout | null>("/me/workouts/today"),

  getWorkoutById: (id: string) => request<Workout>(`/me/workouts/${id}`),

  startSession: (planned_workout_id: string) =>
    request<Session>("/me/sessions", {
      method: "POST",
      body: JSON.stringify({ planned_workout_id }),
    }),

  updateSession: (sessionId: string, exercise_logs: SessionExerciseLogInput[]) =>
    request<Session>(`/me/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ exercise_logs }),
    }),

  finishSessionFeedback: (
    sessionId: string,
    payload: {
      completed: boolean;
      perceived_effort: number;
      energy_level: number;
      soreness_level: number;
      difficulty_level: number;
      notes?: string;
    },
  ) =>
    request<Session>(`/me/sessions/${sessionId}/feedback`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProgress: () => request<ProgressSummary>("/me/progress"),

  addMetric: (data: BodyMetricInput) =>
    request("/me/metrics", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCoachMessages: () => request<CoachMessage[]>("/me/coach/messages"),

  sendCoachMessage: (message: string) =>
    request<CoachMessage>("/me/coach/messages", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  getNotifications: () => request<{ notifications: NotificationItem[] }>("/me/notifications"),

  markNotificationRead: (notificationId: string) =>
    request<NotificationItem>(`/me/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsRead: () =>
    request<{ updated: number }>("/me/notifications/read-all", { method: "POST" }),

  getAchievements: () => request<{ achievements: AchievementItem[] }>("/me/achievements"),
};
