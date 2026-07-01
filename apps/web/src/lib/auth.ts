const SESSION_KEY = "personal_ai_session";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function markAuthenticated(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
  inMemoryAccessToken = null;
}

export function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
